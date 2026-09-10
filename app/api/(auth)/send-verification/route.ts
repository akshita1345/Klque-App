import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmailService } from "@/server/services/verification.service";
import apiHandler from "@/utils/apiHandler";

async function handler(request: NextRequest) {
  const { email } = await request.json();
  const result = await sendVerificationEmailService(email);
  return NextResponse.json(result);
}

export const POST = (req: NextRequest) => apiHandler(req, handler);