import { NextRequest, NextResponse } from "next/server";
import { verifyEmailService } from "@/server/services/verification.service";
import apiHandler from "@/utils/apiHandler";

async function handler(request: NextRequest) {
  const { token, otp, email } = await request.json();

  if (!token && !otp) {
    return NextResponse.json({ error: "Either token or OTP required" }, { status: 400 });
  }

  try {
    const response = await verifyEmailService(email, token, otp);
    if (typeof response === 'object' && response !== null && 'message' in response) {
      return NextResponse.json({ message: response.message });
    } else {
      return NextResponse.json({ message: "Email verified successfully" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export const POST = (req: NextRequest) => apiHandler(req, handler);