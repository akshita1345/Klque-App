import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { User } from '@/server/db/mongodb/user/user.model';
import dbConnect from '@/utils/dbConnect';
import { getUserById } from '@/server/db/mongodb/user/user.query';

// Initialize Stripe once
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
});

export async function POST(req: Request) {
  try {
    const { sessionCode, userId } = await req.json();

    // Validate required input
    if (!sessionCode || !userId) {
      return NextResponse.json(
        { success: false, error: 'Session Code and User ID are required' },
        { status: 400 }
      );
    }

    // Ensure DB connection
    await dbConnect();

    // Fetch user
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate sessionCode match
    if (user.sessionCode?.toString() !== sessionCode.toString()) {
      return NextResponse.json(
        { success: false, error: 'Invalid session code' },
        { status: 401 }
      );
    }

    // Update subscription status
    await User.findByIdAndUpdate(
      userId,
      { isSubscribed: true, isSubscriptionCancel: false, plan: user?.selectedPlan, selectedPlan: null },
      { new: true }
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error verifying payment:', error.message || error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}