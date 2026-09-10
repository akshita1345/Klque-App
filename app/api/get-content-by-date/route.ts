import { getContentsByDateService } from "@/server/services/content.service";
import apiHandler from "@/utils/apiHandler";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const getQueryParam = (url: URL, param: string) => url.searchParams.get(param) || null;

async function handler(request: NextRequest, user: any) {
  try {
    const date = getQueryParam(request.nextUrl, "date");

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    if (!user || !user._id) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    const result = await getContentsByDateService(date, user._id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const GET = (req: NextRequest) => apiHandler(req, handler); 