import { GENERAL_ERROR } from "@/constant/error-messages";
import mongoose from "mongoose"
import { models } from "../db/mongodb";
import { getChatConversationWithPaginate } from "../db/mongodb/chat-conversation/chat-conversation.query";
import { getUserById } from "../db/mongodb/user/user.query";


const ObjectId = mongoose.Types.ObjectId;

export const getChatConversationsByCustomerId = async (input: any) => {
    try {
        const { userId, skip, limit, historyId } = input;

        const existingUser = await getUserById(userId);
        if (!existingUser) {
            return { data: [], count: 0 };
        }

        // Fetch total count
        const totalCount = historyId ? await models.ChatConversation.countDocuments({ userId: new ObjectId(userId), historyId: new ObjectId(historyId), isDeleted: false }) : 0;

        // Fetch conversations based on customer and facebookPageId
        const conversationResponse: any = historyId ? await getChatConversationWithPaginate({ userId: new ObjectId(userId), historyId: new ObjectId(historyId) }, skip, limit, { timestamp: -1 }) : [];

        return { data: conversationResponse || [], count: totalCount };

    } catch (error: any) {
        throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG);
    }
};

export const getLastGeneratedScript = async (userId: any) => {
    try {
        const lastScript: any = await models
            .ChatConversation
            .findOne
            ({ userId: new ObjectId(userId), isDeleted: false, isScriptResponse: true, senderId: "aibot" }, { message: 1 }, { sort: { updatedAt: -1 } }).lean();
        return lastScript?.message;
    } catch (error: any) {
        throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG);
    }
};