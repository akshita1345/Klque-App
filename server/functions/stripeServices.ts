import { currency } from '@/config';
import { managePortalConfiguration } from './common';

const stripeServices = {
    async getPriceById(priceId: any) {
        try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
            const price = await stripe.prices.retrieve(priceId);
            return price;
        }
        catch (err) { return false }
    },

    async getUserPaymentCheckoutSession(payData: any, context: any) {
        return new Promise(async (resolve, reject) => {
            try {
                const industry = context?.me?.company?.industry;
                const { email, userId, priceId } = payData;
                const metaData = { email, userId: userId?.toString(), industry };
                let tokenDataInput = {
                    success_url: `${context?.origin}/`,
                    cancel_url: `${context?.origin}/`,
                    metadata: metaData,
                    customer_email: email,
                    currency: 'usd',
                    payment_method_types: ['card'],
                    line_items: [{ quantity: 1, price: priceId }],
                    mode: 'subscription',
                    subscription_data: {
                        metadata: metaData,
                        trial_settings: {
                            end_behavior: {
                                missing_payment_method: 'cancel',
                            },
                        },
                        trial_period_days: 14, // You can change as your need
                    }
                }
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
                const session = await stripe.checkout.sessions.create(tokenDataInput);
                resolve(session);
            } catch (error) {
                console.log("Error while get payment link ::  ", error)
                reject(error);
            }
        })
    },

    async updateUserSubscription(priceId: any, subscriptionId: string, metadata: any) {
        return new Promise(async (resolve, reject) => {
            try {

                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                if (subscription) {
                    const updateSubscription = await stripe.subscriptions.update(subscriptionId, {
                        items: [{
                            id: subscription?.items?.data?.[0]?.id,
                            price: priceId,
                            metadata,
                        }],
                        proration_behavior: 'always_invoice',
                    });
                    resolve(updateSubscription);
                } else {
                    reject("User subscription is not found!");
                }
            } catch (error) {
                console.log("Error while updating user subscription: ", error);
                reject(error);
            }
        });
    },

    async cancelSubscription(subscriptionId: any) {
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
    },

    async getInvoiceDetails(invoiceId: any) {
        try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
            const invoice = await stripe.invoices.retrieve(invoiceId);
            return invoice;
        } catch (error) {
            console.log("Error while fetch invoice detail ::  ", error)
            return error;
        }
    },

    async createCustomerPortal(customerId: any) {
        if (customerId) {
            try {
                const createPortalConfiguration = await managePortalConfiguration();
                if (createPortalConfiguration) {
                    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
                    const portal = await stripe.billingPortal.sessions.create({
                        customer: customerId,
                        return_url: `${process.env.ENDPOINT_URL}/pages/pricing`,
                    });
                    return portal;
                }
            } catch (error) {
                console.log("Error while create customer portal ::  ", error)
                return error;
            }
        }
        else {
            return "customerId is missing"
        }
    },

    async updateSubscriptionAndChargeNewItem(subscriptionId: any, newPriceId: any) {
        try {
            // Update subscription for add new item
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
            const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
                items: [
                    {
                        price: newPriceId,
                    }, // Add the new item
                ],
                proration_behavior: 'always_invoice',
            });
            return updatedSubscription;
        } catch (error) {
            console.error('Error: When update subscription item,', error);
            return error;
        }
    },

    async deleteSubscriptionItem(itemId: any) {
        try {
            // Delete subscription item
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
            const deleteItem = await stripe.subscriptionItems.del(itemId);
            return deleteItem ? true : false;
        } catch (error) {
            console.error('Error: When delete subscription item.', error);
            return error;
        }
    },

    async createNewPrice({ amount, interval, product_data }: { amount: number, interval: string, product_data: any }) {
        try {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
            const price = await stripe.prices.create({
                currency: currency,
                unit_amount: amount,
                recurring: {
                    interval: interval,
                },
                product_data,
            });
            return price;
        } catch (error: any) {
            throw new Error(error);
        }
    }
}

export default stripeServices