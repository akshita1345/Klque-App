import { getUserById } from "@/server/db/mongodb/user/user.query";
import { getCustomerPortalService } from "@/server/services/plan.service";
import authMiddleware from "@/utils/authMiddleware";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: Request, user: any) {
    try {
        if (!user) {
            return NextResponse.json({ error: "User not found!" }, { status: 400 });
        }
        const getPortal = await getCustomerPortalService(user?.customerId);
        return NextResponse.json({ data: getPortal }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const GET = (req: NextRequest) => authMiddleware(req, handler); 