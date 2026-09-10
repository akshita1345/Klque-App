import { NextRequest, NextResponse } from "next/server";
import { deleteOneUser, updateOneUser } from "@/server/db/mongodb/user/user.query";
import { deleteSessionRecord } from "@/server/db/mongodb/session/session.query";
import authMiddleware from "@/utils/authMiddleware";
import dbConnect from "@/utils/dbConnect";
import mongoose from "mongoose";
import { cancelSubscription } from "@/server/functions/common";

const ObjectId = mongoose.Types.ObjectId;

async function handler(request: NextRequest, user: any) {
  try {
    await dbConnect();

    if (!user || !user._id) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    // Cancel Subscription
    if (user?.subscriptionId) {
      const getSubscription = await cancelSubscription(user?.subscriptionId);
      if (getSubscription) {
        await updateOneUser("_id", new ObjectId(user?._id), {
          isSubscriptionCancel: true
        });
      }
    }

    // Delete user account (soft delete - sets isDeleted: true)
    const deleteResult = await deleteOneUser(user?._id);

    if (!deleteResult) {
      return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }

    // Delete all user sessions
    await deleteSessionRecord(user._id);

    return NextResponse.json({
      message: "Account successfully deleted",
      success: true
    }, { status: 200 });

  } catch (error: any) {
    console.error("Account deletion error:", error);
    return NextResponse.json({
      error: error.message || "Internal Server Error"
    }, { status: 500 });
  }
}

export const DELETE = (request: NextRequest) => authMiddleware(request, handler); 