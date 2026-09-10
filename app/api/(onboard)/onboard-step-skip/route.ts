import { NextRequest, NextResponse } from "next/server";
import { stepOnboardSkipService } from "@/server/services/onboard.service";
import apiHandler from "@/utils/apiHandler";

export const dynamic = 'force-dynamic';

async function handler(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, userId } = body;
    return NextResponse.json(await stepOnboardSkipService(step, userId));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = (req: NextRequest) => apiHandler(req, handler);