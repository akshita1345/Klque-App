import mongoose from "mongoose";
import { models } from "../db/mongodb";
import { getUserById, updateOneUser } from "../db/mongodb/user/user.query";
import stripeServices from "../functions/stripeServices";
const ObjectId = mongoose.Types.ObjectId;

export const getAllSubscriptionHistoryService = async (subscriptionId: string) => {
    try {
        if (subscriptionId) {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, { apiVersion: process.env.STRIPE_API_VERSION });
            const invoices = await stripe.invoices.list({ subscription: subscriptionId });

            const invoiceFilterData = invoices?.data?.map((item: any) => {
                return {
                    id: item?.id,
                    planPrice: item?.amount_paid ? item.amount_paid / 100 : 0,
                    invoiceUrl: item?.hosted_invoice_url,
                    planDate: new Date(item?.created * 1000),
                    planName: item?.lines?.data?.[0]?.description,
                }
            })
            const totalDocs = invoiceFilterData?.length || 0;

            return { data: invoiceFilterData || [], count: totalDocs };
        } else {
            return { data: [], count: 0 };
        }

    } catch (error: any) {
        throw new Error(error);
    }
}

export const getCustomerPortalService = async (customerId: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const getPortal = await stripeServices.createCustomerPortal(customerId)
            resolve(getPortal);
        } catch (error) {
            reject(error)
        }
    });

}

export const cancelSubscriptionService = async (userId: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const findUser: any = await getUserById(userId);
            if (findUser) {
                const getSubscription = await stripeServices.cancelSubscription(findUser?.subscriptionId)
                if (getSubscription) {
                    findUser.sessionCode = null;
                    findUser.planId = null;
                    // findUser.subscriptionId = null;
                    findUser.isSubscriptionCancel = true;
                    findUser.save();
                }
                resolve(getSubscription)
            }
            else reject("User not found!")
        } catch (error: any) {
            reject(error);
        }
    })
}

export const updateSubscriptionService = async (args: any, user: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            const newPrice: any = await stripeServices?.createNewPrice(args);

            if (!newPrice?.id) {
                reject("New price not created!")
            }

            try {
                await stripeServices.updateUserSubscription(newPrice?.id, user?.subscriptionId, args?.metadata);
            } catch (error) {
                reject(error);
            }

            await updateOneUser("_id", user?._id, { plan: args?.metadata?.plan, planTime: args?.interval });

            resolve({ success: true });
        } catch (error) {
            reject(error);
        }
    });
}

export const getFilterCategoriesService = async (userId: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const getFilterCategories = await models?.Content?.aggregate([
                {
                    $match: {
                        userId: new ObjectId(userId),
                        isDeleted: false,
                    }
                },
                {
                    $facet: {
                        targetAudience: [
                            { $group: { _id: "$targetAudience", count: { $sum: 1 } } },
                            { $sort: { _id: 1 } },
                            { $project: { label: "$_id", count: 1, id: "$_id" } }
                        ],
                        platform: [
                            { $group: { _id: "$platform", count: { $sum: 1 } } },
                            { $sort: { _id: 1 } },
                            { $project: { label: "$_id", count: 1, id: "$_id" } }
                        ],
                        contentType: [
                            { $group: { _id: "$contentType", count: { $sum: 1 } } },
                            { $sort: { _id: 1 } },
                            { $project: { label: "$_id", count: 1, id: "$_id" } }
                        ],
                        contentPillar: [
                            { $group: { _id: "$contentPillar", count: { $sum: 1 } } },
                            { $sort: { _id: 1 } },
                            { $project: { label: "$_id", count: 1, id: "$_id" } }
                        ]
                    }
                }
            ])
            resolve(getFilterCategories?.[0]);
        } catch (error) {
            reject(error)
        }
    });
}
