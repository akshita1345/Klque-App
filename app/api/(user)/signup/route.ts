import { NextResponse } from "next/server";
import { signUpService } from "@/server/services/user.service";
import dbConnect from "@/utils/dbConnect";

export async function POST(request: any) {
    try {
        // Ensure database connection is established
        await dbConnect();

        const body = await request.json();
        const { email, password, fullName: name, profession, otherProfession = "" } = body;

        // Process email to lowercase
        const normalizedEmail = email?.toLowerCase();

        // Call the sign-up service
        const res = await signUpService({
            email: normalizedEmail,
            password,
            name,
            profession: profession === "other" ? otherProfession : profession,
        });

        return NextResponse.json(res);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}