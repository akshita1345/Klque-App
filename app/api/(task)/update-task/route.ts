import SendInvites from "@/server/functions/sendInvites";
import { updateTaskService } from "@/server/services/task.service";
import apiHandler from "@/utils/apiHandler";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, user: any) {
    try {
        if (!user || !user._id) {
            return NextResponse.json({ error: "User authentication required" }, { status: 401 });
        }

        const timezone = request.nextUrl.searchParams.get("timezone") || "";
        const body = await request.json();
        if (!body.taskId) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }

        // Add user ID to verify ownership
        const updateData = {
            ...body,
            userId: user._id
        };

        const serviceResult = await updateTaskService(updateData);
        if (!serviceResult) {
            return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
        }
        const { update: result, existingTask } = serviceResult;
        if (user.taskInvites && (
            (existingTask?.date && result?.date && !moment(result?.date).isSame(moment(existingTask?.date))) ||
            (result?.title && existingTask?.title && result?.title !== existingTask?.title)
        ))
            SendInvites({
                id: result?.id || result?._id,
                to: user.email,
                subject: "Task updated",
                summary: `${result.title}`,
                description: `${result.title}`,
                ...(result?.date && {
                    start: moment.tz(result?.date, timezone).toISOString(),
                    end: moment.tz(result?.date, timezone).add(30, "minutes").toISOString(),
                }),
                location: `${process.env.ENDPOINT_URL}/plan?contentId=${result?.id || result?._id}`,
                attendees: [
                    //   { email: "recipient@example.com", name: "Recipient Name", rsvp: true }
                ],
                action: "cancel",
                allDay: false,
                timezone
            })
        return NextResponse.json({ success: !!result }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
export const PUT = (req: NextRequest) => apiHandler(req, handler);