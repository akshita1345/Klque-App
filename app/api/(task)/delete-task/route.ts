import { deleteTaskService } from "@/server/services/task.service";
import apiHandler from "@/utils/apiHandler";
import { NextRequest, NextResponse } from "next/server";
import { getTaskById } from "@/server/db/mongodb/task/task.query";
import mongoose from "mongoose";
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
        if (!body.taskId) {
            return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
        }

        // Verify task ownership before deleting
        const task = await getTaskById(new mongoose.Types.ObjectId(body.taskId));

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 });
        }

        // Check if the task belongs to the user
        if (task.userId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: "Unauthorized to delete this task" }, { status: 403 });
        }

        const result = await deleteTaskService(body.taskId);
        if (user.taskInvites)
            SendInvites({
                id: result?.id || result?._id,
                to: user.email,
                subject: "Task deleted",
                summary: `${result.title}`,
                description: `${result.title}`,
                ...(result?.date && {
                    start: moment.tz(result?.date, timezone).startOf("day").toISOString(),
                    end: moment.tz(result?.date, timezone).endOf("day").toISOString(),
                }),
                location: `${process.env.ENDPOINT_URL}/plan?contentId=${result?.contentId}`,
                attendees: [
                    //   { email: "recipient@example.com", name: "Recipient Name", rsvp: true }
                ],
                action: "cancel",
                allDay: true,
            })
        return NextResponse.json({ success: !!result }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
export const DELETE = (req: NextRequest) => apiHandler(req, handler);