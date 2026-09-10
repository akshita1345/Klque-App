import { getContentListService } from "@/server/services/content.service";
import apiHandler from "@/utils/apiHandler";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, user: any) {
    try {
        const type = request.nextUrl.searchParams.get("type") || "content";
        const date = request.nextUrl.searchParams.get("date");
        const timezone = request.nextUrl.searchParams.get("timezone") || "";
        const from = request.nextUrl.searchParams.get("from") || "";

        // Handle filters from request body if it's a POST request
        let filters = {};
        if (request.method === 'POST') {
            try {
                const body = await request.json();
                filters = body.filters || {};
            } catch (e) {
                // If body parsing fails, continue without filters
                console.error('Error parsing request body:', e);
            }
        }

        // Pass filters to service (service needs to be updated to handle filters)
        const result = await getContentListService(user?._id, type, date || null, filters, timezone, from);
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
export const GET = (req: NextRequest) => apiHandler(req, handler);
export const POST = (req: NextRequest) => apiHandler(req, handler);