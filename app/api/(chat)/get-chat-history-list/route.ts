import { NextRequest, NextResponse } from "next/server";
import apiHandler from "@/utils/apiHandler";
import { getChatHistoryList } from "@/server/db/mongodb/chat-conversation/chat-conversation.query";
import { models } from "@/server/db/mongodb";

export const dynamic = 'force-dynamic';

// Helper to safely fetch query parameters
const getQueryParam = (url: URL, param: string) => url.searchParams.get(param);

async function handler(request: NextRequest) {
    try {

        const userId = getQueryParam(request.nextUrl, "userId") || "";
        const skip = getQueryParam(request.nextUrl, "skip") || 0;
        const limit = getQueryParam(request.nextUrl, "limit") || 20;

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const historyListData = await getChatHistoryList({ userId }, skip, limit);
        const count = await models?.ChatHistory?.countDocuments({ userId });

        return NextResponse.json({ data: historyListData, count });
    } catch (error) {
        console.error("Error in handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const GET = (req: NextRequest) => apiHandler(req, handler);