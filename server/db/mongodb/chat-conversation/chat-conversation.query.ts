import { models } from "..";

export const getChatConversationWithPaginate = async (arg: object, skip: number, limit: number, sort: any) => await models?.ChatConversation.find({ ...arg, isDeleted: false }).populate({ path: "userId" }).sort(sort).skip(skip).limit(limit);

export const getChatConversationWithLimitFields = async (arg: object) => await models?.ChatConversation.find({ ...arg, isDeleted: false }).sort({ timestamp: -1 }).limit(40);

export const getChatConversationWithLimit = async (arg: object) => await models?.ChatConversation.find({ ...arg, isDeleted: false }).sort({ timestamp: -1 }).limit(1);

// Get all recent conversations for a user regardless of historyId
export const getAllUserRecentConversations = async (userId: any, limit: number = 50) => await models?.ChatConversation.find({
  userId,
  isDeleted: false
}).sort({ timestamp: -1 }).limit(limit);

export const createChatConversation = async (newChatConversationInput: any) => {
  const newChatConversation = await models.ChatConversation.create(newChatConversationInput);
  const ChatConversationObj = newChatConversation.toObject();
  return ChatConversationObj;
}

export const updateOneConversation = async (filterKey: string, filter: any, update: any) => await models.ChatConversation.findOneAndUpdate({ [filterKey]: filter, isDeleted: false }, { $set: update }, { new: true });

export const getChatHistoryById = async (_id: any) => await models?.ChatHistory.findById({ _id, isDeleted: false });

export const getChatHistoryList = async (arg: object, skip: any, limit: any): Promise<any[]> => await models?.ChatHistory.find({ ...arg, isDeleted: false }).populate({ path: "userId" }).sort({ timestamp: 1 }).skip(skip).limit(limit);

export const createChatHistory = async (newHistoryInput: any) => {
  const newChatHistory = await models.ChatHistory.create(newHistoryInput);
  const ChatHistoryObj = newChatHistory.toObject();
  return ChatHistoryObj;
}

export const updateOneChatHistoryRecord = async (filterKey: string, filter: any, update: any) => await models.ChatHistory.findOneAndUpdate({ [filterKey]: filter, isDeleted: false }, { $set: update }, { new: true });