import { NextRequest, NextResponse } from "next/server";

const corsMiddleware = async (req: NextRequest, handler: Function) => {
  const response = await handler(req);

  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('origin', process.env.ENDPOINT_URL || "");
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  headers.set('Access-Control-Allow-Headers', 'authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',);

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers });
  }

  return new NextResponse(response.body, { ...response, headers });
};

export default corsMiddleware;