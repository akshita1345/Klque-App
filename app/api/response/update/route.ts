import { NextRequest, NextResponse } from 'next/server';
import { updateResponse } from '../../../../server/services/response.service';
import dbConnect from '../../../../utils/dbConnect';
import authMiddleware from '../../../../utils/authMiddleware';

async function handler(req: NextRequest, user: any) {
  try {
    await dbConnect();
    const { id, ...update } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const response = await updateResponse(id, update);
    if (!response) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: response });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update response' }, { status: 500 });
  }
}

export const PATCH = (req: NextRequest) => authMiddleware(req, handler); 