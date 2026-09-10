import { NextRequest, NextResponse } from 'next/server';
import { listResponsesByUser } from '../../../../server/services/response.service';
import dbConnect from '../../../../utils/dbConnect';
import authMiddleware from '../../../../utils/authMiddleware';

async function handler(req: NextRequest, user: any) {
  try {
    await dbConnect();
    if (!user || !user._id) {
      return NextResponse.json({ error: 'Missing user' }, { status: 400 });
    }
    const responses = await listResponsesByUser(user._id);
    return NextResponse.json({ success: responses });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to list responses' }, { status: 500 });
  }
}

export const GET = (req: NextRequest) => authMiddleware(req, handler); 