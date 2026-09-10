import { NextRequest, NextResponse } from "next/server";
import apiHandler from "@/utils/apiHandler";
import { createTaskService } from "@/server/services/task.service";
import SendInvites from "@/server/functions/sendInvites";
import moment from "moment";

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, user: any) {
    try {
        if (!user || !user._id) {
            return NextResponse.json({ error: "User authentication required" }, { status: 401 });
        }

        const timezone = request.nextUrl.searchParams.get("timezone") || "";
        const body = await request.json();
        // Add user ID to the task data
        const taskData = {
            ...body,
            userId: user._id
        };

        const result = await createTaskService(taskData);
        if (user.taskInvites)
            SendInvites({
                id: result?.id || result?._id,
                to: user.email,
                subject: "New task scheduled",
                summary: `${result.title}`,
                description: `${result.title}`,
                ...(result?.date && {
                    start: moment.tz(result?.date, timezone).toISOString(),
                    end: moment.tz(result?.date, timezone).add(30, "minutes").toISOString(),
                }),
                location: `${process.env.ENDPOINT_URL}/plan?contentId=${result?.contentId}`,
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