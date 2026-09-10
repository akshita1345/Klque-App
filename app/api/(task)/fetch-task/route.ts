import { getTasksByDateService } from "@/server/services/task.service";
import apiHandler from "@/utils/apiHandler";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Helper function to get query parameters
const getQueryParam = (url: URL, param: string) => url.searchParams.get(param) || null;

async function handler(request: NextRequest, user: any) {
  try {
    let dateParam = getQueryParam(request.nextUrl, "date");
    let timezone = getQueryParam(request.nextUrl, "timezone");

    let date: string[] = [];
    if (dateParam?.includes(',')) {
      date = dateParam.split(',');
    } else if (dateParam) {
      date = [dateParam];
    }

    if (!date || date.length === 0) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    if (!user || !user._id) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    const result = await getTasksByDateService(date, user._id, timezone || 'UTC');
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const GET = (req: NextRequest) => apiHandler(req, handler); 