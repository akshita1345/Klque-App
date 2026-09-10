import { NextRequest, NextResponse } from "next/server";
import { getProfileSummary } from "../ai-assist/tools-helper";
import { createProfileSummary, getLastProfileSummary } from "@/server/db/mongodb/profile-summary/profileSummary.query";
import { checkAndTriggerCreditAlerts } from "@/server/services/openrouter.service";

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const validationResult = await request.json();

        if (!validationResult) {
            return NextResponse.json(
                {
                    error: "Invalid request data",
                    details: validationResult.error.format()
                },
                { status: 400 }
            );
        }

        // Check and trigger credit alerts before LLM call
       // await checkAndTriggerCreditAlerts();

        // Process the request using the existing getProfileSummary function
        let profileSummary = await getProfileSummary(validationResult);

        try {
            // Check if the response is wrapped in ```json code blocks
            if (typeof profileSummary === 'string') {
                const jsonBlockMatch = profileSummary.match(/```json\s*([\s\S]*?)\s*```/);
                if (jsonBlockMatch && jsonBlockMatch[1]) {
                    // Extract the JSON content from within the code block
                    profileSummary = jsonBlockMatch[1];
                }

                // Parse the JSON string
                profileSummary = JSON.parse(profileSummary);
            }

            await createProfileSummary({
                userId: validationResult.userId,
                profileSummary: profileSummary
            });

            return NextResponse.json({ data: profileSummary }, { status: 200 });
        } catch (error) {
            console.error("Error parsing profile summary:", error);
            return NextResponse.json({ data: profileSummary }, { status: 200 });
        }
    } catch (error) {
        console.error("Error in profile summary API:", error);

        return NextResponse.json(
            {
                error: "Failed to generate profile summary",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        // Parse request body
        const userId = request.nextUrl.searchParams.get("userId");

        if (!userId) {
            return NextResponse.json(
                {
                    error: "Invalid request data",
                    details: "userId is required"
                },
                { status: 400 }
            );
        }

        // Process the request using the existing getProfileSummary function
        let profileSummary = await getLastProfileSummary(userId);

        return NextResponse.json({ data: profileSummary }, { status: 200 });
    } catch (error) {
        console.error("Error in profile summary API:", error);

        return NextResponse.json(
            {
                error: "Failed to generate profile summary",
                message: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        );
    }
}