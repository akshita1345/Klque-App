import mongoose from "mongoose";
import moment from "moment";

export const setSubscriptionDataInPaymentHistory = async (models: any, data: any) => {
    try {
        const { id, latest_invoice, status, metadata, customer, trial_start, trial_end, discount, created, plan, items } = data;
        const { current_period_start, current_period_end } = items?.data?.[0];
        const { userId, email } = metadata;

        // Check for userId and email
        if (!userId || !email) return 'missing userId or email';

        const setSubscriptionDetails = async (subscribeDetails: any) => {
            // @ts-ignore
            const expiryDate = status === "past_due" ? new Date(moment(current_period_start * 1000).add(1, 'days')._d) : new Date((status === "trialing" ? trial_end : current_period_end) * 1000);

            const input = { planTime: subscribeDetails?.planTime, planId: subscribeDetails?.planId, customerId: customer, subscriptionId: id, expiryDate, status, isOnboarded: true }
            // Update Plan details in User
            await models.User.findByIdAndUpdate(userId, input);

            // Update Payment History
            await models.PaymentHistory.findOneAndUpdate(
                { userId: new mongoose.Types.ObjectId(userId), email },
                { planId: subscribeDetails?.planId, planPrice: subscribeDetails?.planPrice, expiryDate, $addToSet: { subscriptiondata: subscribeDetails } },
                { upsert: true, new: true }
            );

            return subscribeDetails;
        };

        // Process subscription data
        const subscribeDetails = {
            subscriptionId: id,
            invoiceId: latest_invoice,
            status,
            customerId: customer,
            createdAt: new Date(created * 1000),
            isDiscountApplied: !!discount,
            planTime: plan?.interval,
            planId: plan?.id,
            planPrice: status === "trialing" ? 0 : plan?.amount,
            current_period_start: new Date((status === "trialing" ? trial_start : current_period_start) * 1000),
            current_period_end: new Date((status === "trialing" ? trial_end : current_period_end) * 1000)
        };

        await setSubscriptionDetails(subscribeDetails);

    } catch (error) {
        console.error('Error in setSubscriptionDataInPaymentHistory:', error);
    }
};

export const cancelSubscription = async (subscriptionId: any) => {
    try {
        // check is already cancel or not
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
        const getSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (!((getSubscription?.status === "incomplete_expired") || (getSubscription?.status === "canceled"))) {
            const subscription = await stripe.subscriptions.cancel(subscriptionId);
            return subscription;
        } else {
            return getSubscription;
        }
    } catch (error) {
        console.log("Error while cancel subscription ::  ", error)
        return error;
    }
}

export const managePortalConfiguration = async () => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
    const allPortals = await stripe.billingPortal.configurations.list();
    const portal = allPortals?.data[allPortals?.data?.length - 1] || {};
    if (portal && portal?.active) {
        return true;
    } else {
        // *creating a portal if not exist or active
        const configuration = await stripe.billingPortal.configurations.create({
            features: {
                customer_update: {
                    allowed_updates: ['email', 'tax_id'],
                    enabled: true,
                },
                invoice_history: { enabled: true },
                payment_method_update: { enabled: true }
            },
            business_profile: { privacy_policy_url: `${process.env.ENDPOINT_URL}/privacy-policy`, },
        });

        if (configuration?.id) {
            return true
        }
        else {
            console.log("failed to create stripe Portal ")
            return false
        }
    }
}