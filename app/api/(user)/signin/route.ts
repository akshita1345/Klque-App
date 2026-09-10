import { NextResponse } from "next/server";
import { signInService } from "@/server/services/user.service";
import dbConnect from "@/utils/dbConnect";
import { getChatHistoryList } from "@/server/db/mongodb/chat-conversation/chat-conversation.query";

export async function POST(request: any) {
    try {
        // Ensure database connection is established
        await dbConnect();

        const body = await request.json();
        const { email, password } = body;

        // Process email to lowercase
        const normalizedEmail = email?.toLowerCase();

        // Call the sign-up service
        const userResponse = await signInService({
            email: normalizedEmail,
            password,
        });

        const hasUsedAppBefore = !!(await getChatHistoryList({ userId: userResponse?._id }, 0, 1))?.length;
        return NextResponse.json({ user: { ...userResponse, hasUsedAppBefore } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}