import { NextRequest, NextResponse } from "next/server";
import apiHandler from "@/utils/apiHandler";
import { createContentService } from "@/server/services/content.service";
import SendInvites from "@/server/functions/sendInvites";
import moment from "moment-timezone";

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, user: any) {
    try {
        const timezone = request.nextUrl.searchParams.get("timezone") || "";
        const body = await request.json();
        const result: any = await createContentService(body);
        if (user.planInvites)
            SendInvites({
                id: result?.id || result?._id,
                to: user.email,
                subject: "New plan scheduled",
                summary: `${result.ideaTitle}`,
                description: `${result.ideaTitle}`,
                ...(result?.postingDate && {
                    start: moment.tz(result?.postingDate, timezone).toISOString(),
                    end: moment.tz(result?.postingDate, timezone).add(30, "minutes").toISOString(),
                }),
                location: `${process.env.ENDPOINT_URL}/plan?contentId=${result?.id || result?._id}`,
                attendees: [
                    //   { email: "recipient@example.com", name: "Recipient Name", rsvp: true }
                ],
                action: "create",
                allDay: false,
                timezone
            })
        return NextResponse.json({ success: !!result }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export const POST = (req: NextRequest) => apiHandler(req, handler);