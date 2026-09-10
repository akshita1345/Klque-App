import { NextRequest, NextResponse } from "next/server";
import apiHandler from "@/utils/apiHandler";
import { getChatConversationsByCustomerId } from "@/server/services/chat-conversation.service";

export const dynamic = 'force-dynamic';

// Helper to safely fetch query parameters
const getQueryParam = (url: URL, param: string) => url.searchParams.get(param) || null;

async function handler(request: NextRequest) {
    try {

        const userId = getQueryParam(request.nextUrl, "userId");
        const limit = getQueryParam(request.nextUrl, "limit");
        const skip = getQueryParam(request.nextUrl, "skip");
        const historyId = getQueryParam(request.nextUrl, "historyId");

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const historyData = await getChatConversationsByCustomerId({ userId, skip, limit, historyId });

        return NextResponse.json({ chatHistory: historyData });
    } catch (error) {
        console.error("Error in handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const GET = (req: NextRequest) => apiHandler(req, handler);