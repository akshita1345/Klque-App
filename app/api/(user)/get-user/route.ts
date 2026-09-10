import { getChatHistoryList } from "@/server/db/mongodb/chat-conversation/chat-conversation.query";
import { getUserById } from "@/server/db/mongodb/user/user.query";
import dbConnect from "@/utils/dbConnect";
import moment from "moment-timezone";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const userId = request.nextUrl.searchParams.get("userId");
        const timezone = request.nextUrl.searchParams.get("timezone") || moment.tz.guess();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }
        const userData = await getUserById(userId);
        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        } else if ((userData.plan !== "basic" && userData?.expiryDate && !moment.tz(userData.expiryDate, timezone).isAfter(moment.tz(timezone))) || (userData.plan === "basic" && userData.isSubscriptionCancel)) {
            userData.plan = "basic";
            userData.isSubscriptionCancel = false;
            await userData.save();
        }

        const hasUsedAppBefore = !!(await getChatHistoryList({ userId }, 0, 1))?.[0];

        const { password, ...userWithoutPassword } = userData.toObject();
        return NextResponse.json({ user: { ...userWithoutPassword, hasUsedAppBefore } });
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
    }
}