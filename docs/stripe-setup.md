# Stripe Integration Setup

This document provides instructions for setting up Stripe payment processing in the Klque application with a 3-day free trial.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # Change this to your actual base URL in production
```

## Stripe Account Setup

1. Create a Stripe account at [https://stripe.com](https://stripe.com) if you don't already have one.
2. Go to the Stripe Dashboard and get your API keys from the Developers > API keys section.
3. Use the test keys for development and the live keys for production.

## Payment Configuration

The Klque Pro subscription is set to:
- $49 per month
- **3-day free trial** (no payment required for first 3 days)
- Billed monthly after trial ends
- After payment setup, users are redirected to continue the onboarding process

## Trial Implementation

The 3-day free trial is implemented using Stripe's built-in trial functionality:
- Uses `subscription_data.trial_period_days: 3` in checkout session
- Trial status is tracked in the user model with trial start/end dates
- Users get full access during trial period
- Payment is automatically collected after trial ends (unless cancelled)

## Setting Up Webhooks

1. In the Stripe Dashboard, go to Developers > Webhooks.
2. Add a new endpoint with the URL: `https://your-domain.com/api/stripe-webhook`
3. For local development, you can use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhook events to your local server.
4. Select the following events to listen for:
   - `checkout.session.completed` (handles trial start)
   - `customer.subscription.updated` (handles trial ending)
   - `customer.subscription.deleted` (handles cancellations)

## Testing the Integration

1. Use Stripe's test card numbers for testing:
   - Successful payment: `4242 4242 4242 4242`
   - Failed payment: `4000 0000 0000 0002`
2. Expiration date: Any future date
3. CVC: Any 3 digits
4. ZIP: Any 5 digits

**Note**: When testing trials, the subscription will show as "trialing" status for 3 days before attempting to charge the card.

## Deployment Considerations

When deploying to production:

1. Update the `NEXT_PUBLIC_BASE_URL` to your production URL
2. Switch to live Stripe API keys
3. Update the webhook endpoint URL in the Stripe Dashboard
4. Ensure your server has HTTPS enabled for secure payment processing
5. Test the trial flow thoroughly in production environment 