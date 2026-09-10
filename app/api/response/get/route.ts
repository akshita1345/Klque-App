import { NextRequest, NextResponse } from 'next/server';
import { getResponseById } from '../../../../server/services/response.service';
import dbConnect from '../../../../utils/dbConnect';
import authMiddleware from '../../../../utils/authMiddleware';

async function handler(req: NextRequest, user: any) {
  try {
    await dbConnect();
    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const response = await getResponseById(id);
    if (!response) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: response });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get response' }, { status: 500 });
  }
}

export const GET = (req: NextRequest) => authMiddleware(req, handler); 