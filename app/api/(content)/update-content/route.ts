import SendInvites from "@/server/functions/sendInvites";
import { updateContentService } from "@/server/services/content.service";
import apiHandler from "@/utils/apiHandler";
import moment from "moment-timezone";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, user: any) {
    try {
        const timezone = request.nextUrl.searchParams.get("timezone") || "";
        const body = await request.json();
        if (!body.contentId) {
            return NextResponse.json({ error: "Content ID is required" }, { status: 400 });
        }
        const { update: result, existingContent } = await updateContentService(body);
        if (user.planInvites && (
            (result?.postingDate && existingContent?.postingDate && !moment(result?.postingDate).isSame(moment(existingContent?.postingDate))) ||
            (result?.ideaTitle && existingContent?.ideaTitle && result?.ideaTitle !== existingContent?.ideaTitle)
        )) {
            SendInvites({
                id: result?.id || result?._id,
                to: user.email,
                subject: "Plan updated",
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
                action: "update",
                allDay: false,
                timezone
            })
        }
        return NextResponse.json({ success: !!result }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
export const PUT = (req: NextRequest) => apiHandler(req, handler);