import { updateOneUser } from '@/server/db/mongodb/user/user.query';
import { randomStringGenerator } from '@/server/helpers/emails/email.helper';
import dbConnect from '@/utils/dbConnect';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { currency, productDatas } from '@/config';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion,
});

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { userId, email, isYearly, interval, product_data, monthlyPrice, plan } = await req.json();

    // access AUTH_SECRET_KEY from req header
    const authSecretKey = req.headers.get("auth_secret_key");
    if (authSecretKey !== process.env.AUTH_SECRET_KEY) {
      //return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userId && !email) {
      return NextResponse.json({ error: 'User ID or Email is required' }, { status: 400 });
    }

    const sessionCode = randomStringGenerator();

    const userInput: { sessionCode: string, plan?: string, isSubscribed?: boolean, isSubscriptionCancel?: boolean, onboarding?: any, onboardingStep?: number, selectedPlan: string, isOnboarded?: boolean } = { sessionCode, selectedPlan: plan };

    if (plan === "basic") {
      userInput.plan = plan;
      userInput.isSubscribed = true;
      userInput.isSubscriptionCancel = false;
      userInput.isOnboarded = true;
    }

    const user = await updateOneUser(
      userId ? "_id" : "email",
      userId ? new mongoose.Types.ObjectId(userId) : email,
      userInput
    );

    if (!user?._id || !user?.email) {
      return NextResponse.json({ error: 'User not found or missing email' }, { status: 404 });
    }

    if (userInput?.plan === "basic") {
      return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_BASE_URL}/ideate` });
    }
    const isYearlyInterval = isYearly || interval === "YEARLY";

    const metaData = { email: user?.email, userId: user?._id.toString(), plan };
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          // currency: 'usd',
          currency: currency,
          unit_amount: isYearlyInterval ? monthlyPrice * 12 * 100 : monthlyPrice * 100, // $20
          recurring: { interval: isYearlyInterval ? 'year' : 'month' },
          product_data: product_data ? product_data : (productDatas?.[plan] || {}),
        },
        quantity: 1,
      }],
      subscription_data: {
        metadata: metaData,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel',
          },
        },
        trial_period_days: 3
      },
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?session_code=${sessionCode}&userId=${user?._id.toString()}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
      ...(user?.customerId ? { customer: user?.customerId } : { customer_email: user?.email }),
      metadata: metaData,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error.message || error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}