import { NextRequest, NextResponse } from "next/server";
import { sendPasswordResetEmailService } from "@/server/services/verification.service";
import publicApiHandler from "@/utils/publicApiHandler";

async function handler(request: NextRequest) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  try {
    const result = await sendPasswordResetEmailService(email);
    return NextResponse.json(result);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export const POST = (req: NextRequest) => publicApiHandler(req, handler);