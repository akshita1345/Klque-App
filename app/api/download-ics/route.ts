import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const base64 = url.searchParams.get("data");
    const filename = url.searchParams.get("filename") || "invite.ics";
    const method = url.searchParams.get("method") || "REQUEST";

    if (!base64) {
      return new NextResponse("Missing data", { status: 400 });
    }

    const icsBuffer = Buffer.from(base64, "base64");

    return new NextResponse(icsBuffer, {
      status: 200,
      headers: {
        "Content-Type": `text/calendar; method=${method}; charset=UTF-8`,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return new NextResponse("Invalid data", { status: 400 });
  }
}

