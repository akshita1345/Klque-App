import { getContentByIdService } from "@/server/services/content.service";
import apiHandler from "@/utils/apiHandler";
import { NextRequest, NextResponse } from "next/server";

const getQueryParam = (url: URL, param: string) => url.searchParams.get(param) || null;

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
    try {
        const contentId = getQueryParam(request.nextUrl, "contentId");
        const result = await getContentByIdService(contentId || "");
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
export const GET = (req: NextRequest) => apiHandler(req, handler);