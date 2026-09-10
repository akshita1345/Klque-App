import { checkToken } from "@/server/middleware/middleware";
import { NextRequest, NextResponse } from "next/server";

const authMiddleware = async (request: NextRequest, handler: Function) => {
    try {
        // VERIFY THE TOKEN AND RETRIEVE USER DETAILS
        const user = await checkToken(request);
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized: Invalid token" },
                { status: 401 }
            );
        }
        // PASS THE USER DATA AND CONTINUE WITH THE HANDLER
        return await handler(request, user);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Authentication error" },
            { status: 401 }
        );
    }
};

export default authMiddleware;