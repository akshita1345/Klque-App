import { socialAuthentication } from "@/server/services/user.service";
import dbConnect from "@/utils/dbConnect";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { credential, provider } = await req.json();
    const auth = await socialAuthentication(credential, provider);
    return NextResponse.json(auth);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}; 