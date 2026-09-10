import moment from "moment";

export const currency = "usd";

export const saveResponseLimitsByPlan: Record<string, number> = {
    "basic": 10,
}

export const scriptLimitsByPlan: Record<string, number> = {
    "basic": 10, // updated according git issue #84
}

export const creditLimitsByPlan: Record<string, number> = {
    "basic": 25,
    "pro": 100,
    "premium": 300,
    "ultra": 1000,
}


export const customPagination = (array = [], page = 1, limit = 10) => {
    return array?.slice((page - 1) * limit, page * limit);

}

// Check if current plan is active or not
export const checkCurrentPlan = (plan: string, userData: any, isYearly?: boolean) => {
    if (!userData || !userData.plan) return false;

    if (plan === "basic") {
        return userData.plan === "basic";
    }

    if (userData.plan !== plan) return false;

    // Ensure expiryDate exists and is a valid date
    if (!userData.expiryDate) return false;

    if (userData?.planTime !== (isYearly ? "year" : "month")) return false;

    // if plan is expired return false
    if (!moment(userData.expiryDate).isAfter(moment())) return false;

    return true;
}

export const productDatas: Record<string, any> = {
    "basic": {
        name: "Klque Basic",
        description: "Klque Basic",
    },
    "pro": {
        name: "Klque Pro",
        description: "Klque Pro - For creators who want unlimited content power and automation",
    },
    "premium": {
        name: "Klque Premium",
        description: "Klque Premium - For founders and teams who want strategy, insights, and growth",
    },
    "ultra": {
        name: "Klque Ultra",
        description: "Klque Ultra - For high-volume teams and agencies needing advanced tools",
    },
}

export function formatDateToICS(dt: Date | string, fullDay = false) {
    const d = new Date(dt);
    if (isNaN(d.getTime())) throw new Error("Invalid date");

    if (fullDay) {
        // For full day events, use date-only format: YYYYMMDD
        const year = d.getUTCFullYear();
        const month = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        return `${year}${month}${day}`;
    } else {
        // For timed events, use datetime format: YYYYMMDDTHHMMSSZ
        const iso = d.toISOString(); // e.g. 2025-11-25T10:30:00.000Z
        return iso.replace(/[-:]/g, "").split(".")[0] + "Z"; // 20251125T103000Z
    }
}

function formatDateISO(dt: Date | string) {
    // returns ISO without ms, e.g. 2025-11-25T10:30:00Z
    const d = new Date(dt);
    if (isNaN(d.getTime())) throw new Error("Invalid date");
    return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export interface Attendee {
    email: string;
    name?: string;
    rsvp?: boolean;
}

interface CalendarUrlOptions {
    summary?: string;
    description?: string;
    start: Date | string;
    end: Date | string;
    location?: string;
    attendees?: Attendee[];
    allDay?: boolean;
}

/** Google Calendar URL ------------------------------------------------- */
export function generateGoogleCalendarUrl({ summary, description, start, end, location, attendees = [], allDay = false }: CalendarUrlOptions) {
    const base = "https://www.google.com/calendar/render";
    const dates = allDay
        ? `${formatDateToICS(end, true)}/${formatDateToICS(end, true)}`
        : `${formatDateToICS(start, false)}/${formatDateToICS(end, false)}`;

    const params = new URLSearchParams({
        action: "TEMPLATE",
        text: summary || "",
        dates,
        details: description || "",
        location: location || "",
    });

    (attendees || []).forEach((a: any) => {
        if (a && a.email) params.append("add", a.email);
    });

    return `${base}?${params.toString()}`;
}

/** Outlook.com (web) deeplink ----------------------------------------- */
export function generateOutlookWebUrl({ summary, description, start, end, location, attendees = [], allDay = false }: CalendarUrlOptions) {
    const base = "https://outlook.office.com/calendar/0/deeplink/compose";
    const params = new URLSearchParams({
        rru: "addevent",
        ...(allDay ? {
            allday: "true",
            startdt: formatDateISO(end),
        } : {
            startdt: formatDateISO(start),
            enddt: formatDateISO(end),
        }),
        subject: summary || "",
        body: description || "",
        location: location || "",
    });

    const toEmails = (attendees || []).map((a) => a.email).filter(Boolean).join(",");
    if (toEmails) params.set("to", toEmails);

    return `${base}?${params.toString()}`;
}