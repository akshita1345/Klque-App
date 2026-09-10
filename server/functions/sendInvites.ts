// pages/api/send-invite.js
// @ts-ignore
import nodemailer from "nodemailer";
import { randomUUID } from "crypto";
import { Attendee, formatDateToICS, generateGoogleCalendarUrl, generateOutlookWebUrl } from "@/config";
import moment from "moment-timezone";

/** Type Definitions ------------------------------------------------------ */

interface Organizer {
    name: string;
    email: string;
}

interface ICSOptions {
    uid?: string;
    start: Date | string;
    end: Date | string;
    summary?: string;
    description?: string;
    location?: string;
    organizer?: Organizer;
    attendees?: Attendee[];
    allDay?: boolean;
    sequence?: number;
    method?: "REQUEST" | "CANCEL";
}

interface HtmlTemplateOptions {
    summary: string;
    description: string;
    start: Date | string;
    end: Date | string;
    location: string;
    googleCalendarUrl: string;
    outlookUrl: string;
    icsDataUri: string;
    downloadUrl?: string;
    endpointUrl?: string;
    timezone?: string;
}

interface MultiEventItem {
    id?: string;
    summary?: string;
    description?: string;
    start: Date | string;
    end: Date | string;
    location?: string;
    attendees?: Attendee[];
    sequence?: number;
    allDay?: boolean;
}

interface SendInvitesMultiplePayload {
    to: string;
    subject?: string;
    action?: "create" | "update" | "cancel";
    events: MultiEventItem[];
}

interface SendInvitesPayload {
    id?: string; // uid (optional for create)
    to: string;
    subject?: string;
    summary?: string;
    description?: string;
    start: Date | string;
    end: Date | string;
    location?: string;
    attendees?: Attendee[];
    action?: "create" | "update" | "cancel";
    sequence?: number; // last known sequence (for update/cancel)
    allDay?: boolean; // true -> DATE value in ICS
    timezone?: string;
}

/** Helpers -------------------------------------------------------------- */
function escapeICSText(text: string = "") {
    return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,");
}
function escapeHTML(s: string = "") {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

/** Create ICS content -------------------------------------------------- */
function createICS({
    uid = randomUUID(),
    start,
    end,
    summary = "Event",
    description = "",
    location = "",
    organizer = { name: "Organizer", email: process.env.FROM_EMAIL || "organizer@example.com" },
    attendees = [],
    allDay = false,
    sequence,
    method = "REQUEST",
}: ICSOptions) {
    // dtstamp should be a full timestamp
    const dtstamp = formatDateToICS(new Date(), false);

    // choose date format fields depending on allDay
    const dtstart = formatDateToICS(start, allDay);
    const dtend = formatDateToICS(end, allDay);

    // Build attendee lines
    const attendeeLines = (attendees || [])
        .map((a) => {
            const cn = a.name ? `;CN=${escapeICSText(a.name)}` : "";
            const rsvp = a.rsvp ? ";RSVP=TRUE" : "";
            return `ATTENDEE${cn}${rsvp}:MAILTO:${a.email}`;
        })
        .join("\r\n");

    // If allDay use VALUE=DATE and note dtend in iCal must be the day AFTER for full-day (if you pass exclusive end).
    // Caller should pass end as the day after final day. We'll keep provided end as-is.
    const dtStartLine = allDay ? `DTSTART;VALUE=DATE:${dtend}` : `DTSTART:${dtstart}`;
    const dtEndLine = allDay ? `DTEND;VALUE=DATE:${dtend}` : `DTEND:${dtend}`;

    const lines = [
        "BEGIN:VCALENDAR",
        "PRODID://KLQUE//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        `METHOD:${method}`, // REQUEST or CANCEL
        "BEGIN:VEVENT",
        `UID:${uid}`,
        ...(typeof sequence === "number" ? [`SEQUENCE:${sequence}`] : []),
        `DTSTAMP:${dtstamp}`,
        dtStartLine,
        dtEndLine,
        `SUMMARY:${escapeICSText(summary)}`,
        `DESCRIPTION:${escapeICSText(description)}`,
        `LOCATION:${escapeICSText(location || "")}`,
        `ORGANIZER;CN=${escapeICSText(organizer.name)}:MAILTO:${organizer.email}`,
        attendeeLines,
        method === "CANCEL" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT",
        "END:VCALENDAR",
    ];

    return lines.filter(Boolean).join("\r\n");
}

// Function to create multiple ICS events for multiple attendees
function createMultiICS(method: "REQUEST" | "CANCEL", organizer: Organizer, events: MultiEventItem[]) {
    const dtstamp = formatDateToICS(new Date(), false);
    const header = [
        "BEGIN:VCALENDAR",
        "PRODID://KLQUE//EN",
        "VERSION:2.0",
        "CALSCALE:GREGORIAN",
        `METHOD:${method}`,
    ].join("\r\n");

    // Build one VEVENT block for every event in the supplied array
    const vevents = (events || []).map((ev) => {
        // Generate or reuse a unique identifier for this occurrence
        const uid = ev.id || randomUUID();
        // Determine whether this is an all-day event
        const allDay = !!ev.allDay;
        // Convert start/end to ICS-compliant strings (DATE or DATETIME)
        const dtstart = formatDateToICS(ev.start, allDay);
        const dtend = formatDateToICS(ev.end, allDay);

        // Compose ATTENDEE lines, escaping names and adding RSVP flag when requested
        const attendeeLines = (ev.attendees || [])
            .map((a) => {
                const cn = a.name ? `;CN=${escapeICSText(a.name)}` : "";
                const rsvp = a.rsvp ? ";RSVP=TRUE" : "";
                return `ATTENDEE${cn}${rsvp}:MAILTO:${a.email}`;
            })
            .join("\r\n");

        // Choose DTSTART/DTEND format: VALUE=DATE for all-day, full DATETIME otherwise
        const dtStartLine = allDay ? `DTSTART;VALUE=DATE:${dtend}` : `DTSTART:${dtstart}`;
        const dtEndLine = allDay ? `DTEND;VALUE=DATE:${dtend}` : `DTEND:${dtend}`;

        // Assemble the complete VEVENT block
        return [
            "BEGIN:VEVENT",
            `UID:${uid}`,
            ...(typeof ev.sequence === "number" ? [`SEQUENCE:${ev.sequence}`] : []), // optional sequence for updates
            `DTSTAMP:${dtstamp}`, // global timestamp generated once for the whole calendar
            dtStartLine,
            dtEndLine,
            `SUMMARY:${escapeICSText(ev.summary || "Event")}`,
            `DESCRIPTION:${escapeICSText(ev.description || "")}`,
            `LOCATION:${escapeICSText(ev.location || "")}`,
            `ORGANIZER;CN=${escapeICSText(organizer.name)}:MAILTO:${organizer.email}`,
            attendeeLines,
            method === "CANCEL" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
            "TRANSP:OPAQUE",
            "END:VEVENT",
        ].filter(Boolean).join("\r\n");
    }).join("\r\n"); // Concatenate all VEVENT blocks with CRLF

    return [header, vevents, "END:VCALENDAR"].join("\r\n");
}


/** Create data: URI for ICS (base64) ----------------------------------- */
function makeIcsDataUri(icsContent: string) {
    const base64 = Buffer.from(icsContent, "utf8").toString("base64");
    return `data:text/calendar;charset=utf-8;base64,${base64}`;
}

// Function to create a download URL for ICS file with base64 encoding
function makeIcsDownloadUrl(baseUrl: string, icsContent: string, method: "REQUEST" | "CANCEL") {
    const base64 = Buffer.from(icsContent, "utf8").toString("base64");
    const url = new URL(`${baseUrl}/api/download-ics`);
    url.searchParams.set("data", base64);
    url.searchParams.set("filename", "invite.ics");
    url.searchParams.set("method", method);
    return url.toString();
}

/** HTML template with all three buttons -------------------------------- */
function htmlTemplate({ summary, description, start, end, location, googleCalendarUrl, outlookUrl, icsDataUri, downloadUrl, endpointUrl, timezone = "UTC" }: HtmlTemplateOptions) {
    const startDateStr = moment.tz(start, timezone).format("HH:mm on DD MMM YYYY");
    const endDateStr = moment.tz(end, timezone).format("HH:mm on DD MMM YYYY");
    const baseUrl = endpointUrl || process.env.ENDPOINT_URL || "";
    const isUrl = typeof location === "string" && /^https?:\/\//.test(location);
    const safeLoc = escapeHTML(location);
    const locationHtml = isUrl
        ? `<a href="${safeLoc}" target="_blank" style="color:#5d60ff; text-decoration:none;">Click here</a>`
        : safeLoc;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Invitation - KLQUE</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <style type="text/css">
        body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        @media only screen and (max-width: 600px) {
            .mobile-center { text-align: center !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-font-size { font-size: 24px !important; }
            .mobile-button { width: 100% !important; display: block !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Montserrat, -apple-system, 'Segoe UI', sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08); max-width: 600px; border-top: 4px solid #5d60ff;">
                    <tr>
                        <td align="center" style="padding: 36px 40px 16px 40px;">
                            <img src="${baseUrl}/images/logos/klque-logo.PNG" alt="KLQUE" width="120" height="auto" style="display: block; margin: 0 auto;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 40px 32px 40px;" class="mobile-padding">
                            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #111827; line-height: 1.25;" class="mobile-font-size">${escapeHTML(
        summary
    )}</h1>
                            <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">${escapeHTML(description).replace(
        /\n/g,
        "<br/>"
    )}</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 20px; background-color: #f9fafb; border-radius: 10px; border: 1px solid #e5e7eb;">
                                <tr>
                                    <td style="padding: 16px 20px;">
                                        <p style="margin: 0; font-size: 14px; color: #111827;"><span style="font-size:16px;">📅</span> <strong>When (UTC):</strong> ${escapeHTML(
        startDateStr
    )}</p>
                                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #111827;"><span style="font-size:16px;">📍</span> <strong>Where:</strong> ${locationHtml}</p>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 16px 0 0 0; font-size: 13px; color: #6b7280;">The calendar invite is attached as <code>invite.ics</code>.</p>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 22px;">
                                <tr>
                                    <td align="center">
                                        <a href="${googleCalendarUrl}" target="_blank" style="display:inline-block;padding:12px 16px;background:#5d60ff;color:#fff;border-radius:8px;margin-right:8px;text-decoration:none;font-weight:700;">Add to Google Calendar</a>
                                        <a href="${outlookUrl}" target="_blank" style="display:inline-block;padding:12px 16px;background:#0a66c2;color:#fff;border-radius:8px;margin-right:8px;text-decoration:none;font-weight:700;">Add to Outlook (Web)</a>
                                        <a href="${downloadUrl || "#"}" target="_blank" style="display:inline-block;padding:12px 16px;background:#374151;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Download .ics</a>
                                    </td>
                                </tr>
                            </table>
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; background-color: #fff7ed; border-radius: 10px; border-left: 4px solid #f59e0b;">
                                <tr>
                                    <td style="padding: 14px 16px;">
                                        <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.4;">If the buttons do not work, use the attached <code>invite.ics</code> to import the event into Apple Calendar or Outlook desktop.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 26px 40px; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 10px;"><a href="${baseUrl}/privacy-policy" style="color: #6b7280; text-decoration: none; font-size: 12px;">Privacy Policy</a></td>
                                                <td style="padding: 0 10px; color: #d1d5db;">|</td>
                                                <td style="padding: 0 10px;"><a href="${baseUrl}/terms-of-use" style="color: #6b7280; text-decoration: none; font-size: 12px;">Terms of Service</a></td>
                                            </tr>
                                        </table>
                                        <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af;">© ${new Date().getFullYear()} KLQUE. All rights reserved.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;
}

function htmlTemplateMultiple({ events, downloadUrl, endpointUrl }: { events: MultiEventItem[]; downloadUrl: string; endpointUrl?: string }) {
    const baseUrl = endpointUrl || process.env.ENDPOINT_URL || "";
    const items = (events || []).map((ev) => {
        const startStr = new Date(ev.start).toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" });
        const endStr = new Date(ev.end).toLocaleString("en-GB", { timeZone: "UTC", day: "2-digit", month: "long", year: "numeric" });
        const isUrl = typeof ev.location === "string" && /^https?:\/\//.test(ev.location);
        const safeLoc = escapeHTML(ev.location || "");
        const locHtml = isUrl ? `<a href="${safeLoc}" target="_blank" style="color:#5d60ff; text-decoration:none;">${safeLoc.replace(/^https?:\/\//, "")}</a>` : safeLoc;
        return `
            <div style="padding:14px 16px; border:1px solid #e5e7eb; border-radius:10px; background:#f9fafb; margin-bottom:12px;">
                <p style="margin:0; font-size:14px; color:#111827;"><strong>${escapeHTML(ev.summary || "Event")}</strong></p>
                <p style="margin:6px 0 0 0; font-size:13px; color:#374151;">${escapeHTML(ev.description || "")}</p>
                <p style="margin:8px 0 0 0; font-size:13px; color:#111827;">📅 ${escapeHTML(endStr)}</p>
                <p style="margin:4px 0 0 0; font-size:13px; color:#111827;">📍 ${locHtml}</p>
            </div>
        `;
    }).join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Invitations - KLQUE</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <style type="text/css">
        body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        @media only screen and (max-width: 600px) {
            .mobile-center { text-align: center !important; }
            .mobile-padding { padding: 20px !important; }
            .mobile-font-size { font-size: 24px !important; }
            .mobile-button { width: 100% !important; display: block !important; }
        }
    </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Montserrat, -apple-system, 'Segoe UI', sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08); max-width: 600px; border-top: 4px solid #5d60ff;">
                        <tr>
                            <td align="center" style="padding: 36px 40px 16px 40px;">
                                <img src="${baseUrl}/images/logos/klque-logo.PNG" alt="KLQUE" width="120" height="auto" style="display: block; margin: 0 auto;">
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 0 40px 32px 40px;" class="mobile-padding">
                                <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #111827; line-height: 1.25;" class="mobile-font-size">Calendar Invitations</h1>
                                <p style="margin: 16px 0 0 0; font-size: 16px; color: #374151; line-height: 1.6;">Multiple events are attached as <code>invite.ics</code>. Use the download button below to import them into your calendar.</p>
                                ${items}
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 22px;">
                                    <tr>
                                        <td align="center">
                                            <a href="${downloadUrl}" target="_blank" style="display:inline-block;padding:12px 16px;background:#374151;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Download .ics</a>
                                        </td>
                                    </tr>
                                </table>
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 24px; background-color: #fff7ed; border-radius: 10px; border-left: 4px solid #f59e0b;">
                                    <tr>
                                        <td style="padding: 14px 16px;">
                                            <p style="margin: 0; font-size: 12px; color: #92400e; line-height: 1.4;">If the download does not work, use the attached <code>invite.ics</code> to import the events into Apple Calendar or Outlook desktop.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9fafb; padding: 26px 40px; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;" class="mobile-padding">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                    <tr>
                                        <td align="center">
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                                <tr>
                                                    <td style="padding: 0 10px;"><a href="${baseUrl}/privacy-policy" style="color: #6b7280; text-decoration: none; font-size: 12px;">Privacy Policy</a></td>
                                                    <td style="padding: 0 10px; color: #d1d5db;">|</td>
                                                    <td style="padding: 0 10px;"><a href="${baseUrl}/terms-of-use" style="color: #6b7280; text-decoration: none; font-size: 12px;">Terms of Service</a></td>
                                                </tr>
                                            </table>
                                            <p style="margin: 16px 0 0 0; font-size: 11px; color: #9ca3af;">© ${new Date().getFullYear()} KLQUE. All rights reserved.</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
</html>
`;
}

/** API Route ----------------------------------------------------------- */
/**
 * SendInvites unified function:
 * Accepts SendInvitesPayload and optional action: create | update | cancel
 */
export default async function SendInvites(body: SendInvitesPayload) {
    const { ENDPOINT_URL, EMAIL_USER, EMAIL_PASS } = process.env;

    if (!EMAIL_USER || !EMAIL_PASS) {
        return { error: "Missing required environment variables" };
    }

    try {
        const payload = typeof body === "string" ? JSON.parse(body) : body;

        const {
            id,
            to,
            subject = "Calendar invite",
            summary = "Event",
            description = "",
            start,
            end,
            location = "",
            attendees = [],
            action = "create",
            sequence: providedSequence,
            allDay = false,
            timezone
        } = payload as SendInvitesPayload & { action?: string; allDay?: boolean };

        if (!to || !start || !end) {
            return { error: "Missing required fields: to, start, end" };
        }

        const act = String(action || "create").toLowerCase();
        if (!["create", "update", "cancel"].includes(act)) {
            throw new Error("Invalid action. Must be create|update|cancel");
        }
        if ((act === "update" || act === "cancel") && !id) {
            throw new Error("Missing id (UID) for update/cancel actions");
        }

        // Organizer must be the same account that sends (setup env)
        const organizer: Organizer = { name: "KLQUE", email: EMAIL_USER };

        // Determine UID & sequence & method
        const uid = id || randomUUID();
        let method: "REQUEST" | "CANCEL" = "REQUEST";
        let sequence: number | undefined = undefined;

        if (act === "create") {
            method = "REQUEST";
            sequence = typeof providedSequence === "number" ? providedSequence : 0;
        } else if (act === "update") {
            method = "REQUEST";
            sequence = (typeof providedSequence === "number" ? providedSequence : 0) + 1;
        } else {
            method = "CANCEL";
            sequence = (typeof providedSequence === "number" ? providedSequence : 0) + 1;
        }

        // Build ICS with correct method, sequence, and allDay flag
        const ics = createICS({
            uid,
            start,
            end,
            summary,
            description,
            location,
            organizer,
            attendees,
            allDay,
            sequence,
            method,
        });

        // Links + data uri
        const googleCalendarUrl = generateGoogleCalendarUrl({ summary, description, start, end, location, attendees, allDay });
        const outlookUrl = generateOutlookWebUrl({ summary, description, start, end, location, attendees, allDay });
        const icsDataUri = makeIcsDataUri(ics);
        const downloadUrl = makeIcsDownloadUrl(ENDPOINT_URL || "", ics, method);

        // Nodemailer transport (using Gmail service by your earlier code)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS,
            },
        });

        // Build HTML and send
        const html = htmlTemplate({ summary, description, start, end, location, googleCalendarUrl, outlookUrl, icsDataUri, downloadUrl, endpointUrl: ENDPOINT_URL || "", timezone });

        const mailOptions = {
            from: `"KLQUE" <${organizer.email}>`,
            to,
            subject: (act === "update" ? "[UPDATED] " : act === "cancel" ? "[CANCELLED] " : "") + (subject || summary),
            html,
            attachments: [
                {
                    filename: "invite.ics",
                    content: ics,
                    contentType: `text/calendar; method=${method}; charset=UTF-8`,
                },
            ],
            alternatives: [
                {
                    contentType: `text/calendar; method=${method}; charset=UTF-8`,
                    content: ics,
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);

        const result = {
            ok: true,
            action: act,
            messageId: info.messageId,
            uid,
            sequence,
            note: "Persist uid & sequence so future updates/cancels use same values.",
        };
        console.log("🚀 ~ sendInvites.ts:370 ~ SendInvites ~ result:", result);
    } catch (err) {
        console.error("send-invite error:", err);
        return { error: err instanceof Error ? err.message : String(err) };
    }
}

export async function SendInvitesMultiple(body: SendInvitesMultiplePayload | string) {
    // 1) Pull required environment variables
    const { ENDPOINT_URL, EMAIL_USER, EMAIL_PASS } = process.env;
    if (!EMAIL_USER || !EMAIL_PASS) {
        return { error: "Missing required environment variables" };
    }

    try {
        // 2) Normalize incoming payload (string vs object)
        const payload = typeof body === "string" ? JSON.parse(body) : body;
        const { to, subject = "Calendar invites", action = "create", events } = payload as SendInvitesMultiplePayload;

        // 3) Validate core fields
        if (!to || !Array.isArray(events) || events.length === 0) {
            return { error: "Missing required fields: to, events[]" };
        }

        // 4) Normalize and validate action
        const act = String(action || "create").toLowerCase();
        if (!["create", "update", "cancel"].includes(act)) {
            throw new Error("Invalid action. Must be create|update|cancel");
        }

        // 5) Ensure every event has an id when updating or cancelling
        if ((act === "update" || act === "cancel") && events.some((e) => !e.id)) {
            throw new Error("Missing id (UID) for update/cancel events");
        }

        // 6) Build organizer object
        const organizer: Organizer = { name: "KLQUE", email: EMAIL_USER };

        // 7) Determine iCalendar METHOD
        let method: "REQUEST" | "CANCEL" = act === "cancel" ? "CANCEL" : "REQUEST";

        // 8) Normalize events: assign UUIDs if missing and bump sequence numbers
        const normalizedEvents: MultiEventItem[] = events.map((e) => ({
            ...e,
            id: e.id || randomUUID(),
            sequence: typeof e.sequence === "number" ? (act === "create" ? e.sequence : e.sequence + 1) : (act === "create" ? 0 : 1),
        }));

        // 9) Generate multi-event ICS content
        const ics = createMultiICS(method, organizer, normalizedEvents);
        const downloadUrl = makeIcsDownloadUrl(ENDPOINT_URL || "", ics, method);

        // 10) Create Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        });

        // 11) Build HTML body
        const html = htmlTemplateMultiple({ events: normalizedEvents, downloadUrl, endpointUrl: ENDPOINT_URL || "" });

        // 12) Construct email options
        const mailOptions = {
            from: `"KLQUE" <${organizer.email}>`,
            to,
            subject: (act === "update" ? "[UPDATED] " : act === "cancel" ? "[CANCELLED] " : "") + subject,
            html,
            attachments: [
                {
                    filename: "invite.ics",
                    content: ics,
                    contentType: `text/calendar; method=${method}; charset=UTF-8`,
                    cid: "invite-ics",
                },
            ],
            alternatives: [
                {
                    contentType: `text/calendar; method=${method}; charset=UTF-8`,
                    content: ics,
                },
            ],
        };

        // 13) Send email
        const info = await transporter.sendMail(mailOptions);

        // 14) Prepare summary of processed events
        const summary = normalizedEvents.map((e) => ({ uid: e.id, sequence: e.sequence }));

        // 15) Return success payload
        const result = { ok: true, action: act, messageId: info.messageId, events: summary };
        console.log("🚀 ~ sendInvites.ts:722 ~ SendInvitesMultiple ~ result:", result);
    } catch (err) {
        // 16) Catch and return any errors
        return { error: err instanceof Error ? err.message : String(err) };
    }
}
