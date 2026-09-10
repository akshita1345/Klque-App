import mongoose from "mongoose";
import moment from "moment";
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import dbConnect from '@/utils/dbConnect';
import { models } from '@/server/db/mongodb';
import { setSubscriptionDataInPaymentHistory } from "@/server/functions/common";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: process.env.STRIPE_API_VERSION,
});

// This is your Stripe webhook secret for testing your endpoint locally.
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

let ObjectId = mongoose.Types.ObjectId;

export async function POST(req: NextRequest, res: NextResponse) {
  const payload: any = await req.text();
  const sig = req.headers.get('stripe-signature') as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    await dbConnect();
    const data: any = event?.data?.object;
    const hasMetadata = data?.metadata?.email;
    let logInput = {
      operationName: event?.type,
      query: JSON.stringify(event),
      type: 'StripeAPI',
      status: false,
      response: ''
    }

    if (hasMetadata) {
      if (data.cancel_at_period_end) {
        return NextResponse.json("Success", { status: 200 });
      }
      if (event?.type === "customer.subscription.created") {
        await setSubscriptionDataInPaymentHistory(models, data);
      }

      if (event?.type === "payment_intent.succeeded" || event?.type === "customer.subscription.updated") {
        if (event?.type === "customer.subscription.updated") {
          await setSubscriptionDataInPaymentHistory(models, data);

          const secretKey = process.env.STRIPE_SECRET_KEY;
          if (secretKey) {
            try {
              const subscription = await stripe.subscriptions.retrieve(data?.id);
              if (subscription?.id) {
                if (subscription?.status === "past_due") { // invoice status == "open"
                  // INFO: in case of failed payment
                  const { email, userId, plan } = data?.metadata
                  // @ts-ignore
                  const preExpiryDate = new Date(moment(data?.current_period_start * 1000).add(1, 'days')._d)

                  if (userId && email) {
                    await models.User.findOneAndUpdate({ _id: new ObjectId(userId), email },
                      {
                        $set: { subscriptionId: subscription?.id, expiryDate: preExpiryDate, status: subscription?.status }
                      });

                    logInput.status = true;
                    logInput.response = JSON.stringify({ message: `STATUS of SUBSCRIPTION ${subscription?.status} & ExpiryDate: ${preExpiryDate} Reverted...` });
                    await models.PaymentLogs.create(logInput);
                    return NextResponse.json("Success", { status: 200 });

                  } else {
                    console.log('Not found user record in metadata...');
                    logInput.status = false;
                    logInput.response = JSON.stringify({ message: 'Not found LicenseRecordId for revert exp date...' });
                    await models.PaymentLogs.create(logInput);
                    return NextResponse.json("Success", { status: 200 });
                  }
                } else {
                  logInput.status = false;
                  logInput.response = JSON.stringify({ message: `operationName: ${event?.type} & STATUS: ${subscription?.status} not handle by us.` });
                  await models.PaymentLogs.create(logInput);
                  return NextResponse.json("Success", { status: 200 });
                }
              } else {
                logInput.status = false;
                logInput.response = JSON.stringify({ message: 'Missing subscription details (Maybe domain miss match OR)' });
                await models.PaymentLogs.create(logInput);
                return NextResponse.json("Success", { status: 200 });
              }
            } catch (error) {
              logInput.status = false;
              logInput.response = JSON.stringify(error);
              await models.PaymentLogs.create(logInput);
              return NextResponse.json("Success", { status: 200 });
            }
          } else {
            logInput.status = false;
            logInput.response = JSON.stringify({ message: 'Missing secret (Maybe domain miss match)' });
            await models.PaymentLogs.create(logInput);
            return NextResponse.json("Success", { status: 200 });
          }
        } else {
          return NextResponse.json("Success", { status: 200 });
        }

      } else if ((event?.type === "payment_intent.canceled") || (event?.type === "payment_intent.payment_failed")) {
        // INFO: canceled & payment_failed Nothing to Do Just Show error msg.
        logInput.status = false;
        logInput.response = `"${event?.type}" No any action take by us.`;
        await models.PaymentLogs.create(logInput);
        return NextResponse.json("Success", { status: 200 });
      } else {
        logInput.status = false;
        logInput.response = JSON.stringify({ message: event?.type + 'is not handle by us' });
        await models.PaymentLogs.create(logInput);
        return NextResponse.json("Success", { status: 200 });
      }
    }
    else {
      if (event?.type === "payment_intent.succeeded") {
        logInput.status = false;
        logInput.response = JSON.stringify({ message: 'No metadata.' });
        await models.PaymentLogs.create(logInput);
        return NextResponse.json("Success", { status: 200 });
      } else {
        logInput.status = false;
        logInput.response = JSON.stringify({ message: 'No metadata.' });
        await models.PaymentLogs.create(logInput);
        return NextResponse.json("Success", { status: 200 });
      }
    }
  } catch (error) {
    console.log("🚀 ~ file: index.js:133 ~ app.post ~ error:", error)
    return NextResponse.json("Success", { status: 200 });
  }
}