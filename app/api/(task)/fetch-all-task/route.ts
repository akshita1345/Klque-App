import { getTasksService } from "@/server/services/task.service";
import apiHandler from "@/utils/apiHandler";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest, user: any) {
  try {
    if (!user || !user._id) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    const result = await getTasksService(user._id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export const GET = (req: NextRequest) => apiHandler(req, handler);
