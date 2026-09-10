import { NextRequest, NextResponse } from "next/server";
import { resetPasswordService } from "@/server/services/verification.service";
import publicApiHandler from "@/utils/publicApiHandler";

async function handler(request: NextRequest) {
  const { _id, password, code } = await request.json();

  if (!_id || !code || !password) {
    return NextResponse.json({ error: "Code and new password are required" }, { status: 400 });
  }

  try {
    const result = await resetPasswordService({ _id, password, code });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export const POST = (req: NextRequest) => publicApiHandler(req, handler);