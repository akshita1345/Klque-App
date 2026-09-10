import { NextRequest, NextResponse } from "next/server";
import { sendConfirmationEmailService } from "@/server/services/verification.service";
import apiHandler from "@/utils/apiHandler";

async function handler(request: NextRequest) {
  const { userId } = await request.json();
  const result = await sendConfirmationEmailService(userId);
  return NextResponse.json(result);
}

export const POST = (req: NextRequest) => apiHandler(req, handler);
