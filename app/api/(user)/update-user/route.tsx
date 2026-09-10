import { NextRequest, NextResponse } from "next/server";
import { getUserById, updateOneUser } from "@/server/db/mongodb/user/user.query";
import authMiddleware from "@/utils/authMiddleware";
import dbConnect from "@/utils/dbConnect";
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;

async function handler(request: NextRequest, user: any) {
  try {
    await dbConnect();

    if (!user || !user._id) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Extract allowed fields to update
    const allowedUpdates = {
      name: body.name,
      lastName: body.lastName,
      profession: body.profession,
      onboarding: body.onboarding,
      onboardingStep: body.onboardingStep,
      isOnboarded: body.isOnboarded,
      planInvites: body.planInvites,
      taskInvites: body.taskInvites,
    };

    // Remove undefined values
    const updates = Object.fromEntries(
      Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Update user
    const updateResult = await updateOneUser("_id", new ObjectId(user._id), updates);

    if (!updateResult) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }

    return NextResponse.json({
      message: "User successfully updated",
      success: true,
      user: await getUserById(user._id),
    }, { status: 200 });

  } catch (error: any) {
    console.error("User update error:", error);
    return NextResponse.json({
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}

export const PUT = (request: NextRequest) => authMiddleware(request, handler);
