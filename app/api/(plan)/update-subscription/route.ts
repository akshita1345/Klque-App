import { updateOneUser } from "@/server/db/mongodb/user/user.query";
import { updateSubscriptionService } from "@/server/services/plan.service";
import authMiddleware from "@/utils/authMiddleware";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: Request, user: any) {
    try {
        const { amount, interval, product_data, metadata } = await req.json();

        if (!user) {
            return NextResponse.json({ error: "User not found!" }, { status: 400 });
        }

        if (metadata?.plan === "basic") {
            const userInput = {
                plan: metadata?.plan,
                isSubscribed: true,
                isSubscriptionCancel: false,
                selectedPlan: null,
                sessionCode: "",
                customerId: "",
                planId: "",
                planTime: null,
                status: null,
                subscriptionId: "",
            }

            await updateOneUser(
                "_id",
                user?._id,
                userInput
            );

            if (userInput?.plan === "basic") {
                return NextResponse.json({ message: 'Basic plan updated successfully' }, { status: 200 });
            }
        }

        const getPortal = await updateSubscriptionService({ amount, interval, product_data, metadata }, user);
        return NextResponse.json({ data: getPortal }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = (req: NextRequest) => authMiddleware(req, handler); 
