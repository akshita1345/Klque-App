import { NextRequest, NextResponse } from 'next/server';
import { createResponse } from '../../../../server/services/response.service';
import dbConnect from '../../../../utils/dbConnect';
import authMiddleware from '../../../../utils/authMiddleware';
import { getUserById, updateOneUser } from '@/server/db/mongodb/user/user.query';
import { checkCurrentPlan, saveResponseLimitsByPlan } from '@/config';
import mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

async function handler(req: NextRequest, user: any) {
  try {
    await dbConnect();
    const { title, context } = await req.json();
    if (!user || !user._id || !title || !context) {
      return NextResponse.json({ error: 'Missing user, title, or content' }, { status: 400 });
    }

    const userDetails = await getUserById(user._id);

    const currentPlan = checkCurrentPlan(userDetails?.plan, userDetails, userDetails?.planTime === "year") ? userDetails?.plan : "basic";

    // Check if user has used all credits
    if (currentPlan && userDetails?.savedResponseCount >= saveResponseLimitsByPlan[currentPlan || "basic"]) {
      return NextResponse.json({ message: 'You have used all your saved responses. Please upgrade to continue.', type: "LIMIT_REACHED" }, { status: 200 });
    }

    const response = await createResponse({
      userId: user._id,
      title: title,
      context: context,
      isDeleted: false,
    });

    await updateOneUser("_id", new ObjectId(user._id), { savedResponseCount: (Number(userDetails?.savedResponseCount) || 0) + 1 });

    return NextResponse.json({ success: response });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create response' }, { status: 500 });
  }
}

export const POST = (req: NextRequest) => authMiddleware(req, handler); 