import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { executeAgent, formatAiAndHumanMessages, handleModeration, } from './common';
import { createChatConversation, getChatConversationWithLimitFields, getChatConversationWithLimit, getChatHistoryById, createChatHistory, getAllUserRecentConversations, updateOneChatHistoryRecord } from '@/server/db/mongodb/chat-conversation/chat-conversation.query';
import { models } from '@/server/db/mongodb';
import apiHandler from '@/utils/apiHandler';
import { getUserById, updateOneUser } from '@/server/db/mongodb/user/user.query';
import { checkCurrentPlan, creditLimitsByPlan } from '@/config';
import { getTodayCounter, updateCounter } from '@/server/db/mongodb/counter/counter.query';
import { checkAndTriggerCreditAlerts } from '@/server/services/openrouter.service';

export const dynamic = 'force-dynamic';
const ObjectId = mongoose.Types.ObjectId;

async function handler(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, message, senderId, timestamp, historyId, isInitialPrompt, isFirstOnboardingQuery, isScriptGeneration, isTryAgain }: any = body;
        if (!message) {
            return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });
        }
        // Get user details for personalization
        const userDetails = await getUserById(userId);
        const counter = await getTodayCounter(userId);

        if (isScriptGeneration && !isTryAgain) {
            const [chatConversation] = await getChatConversationWithLimit({ userId: new ObjectId(userId), "senderId": "aibot" });
            if (chatConversation) {
                return NextResponse.json({ messageData: chatConversation });
            }
        }

        const currentPlan = checkCurrentPlan(userDetails?.plan, userDetails, userDetails?.planTime === "year") ? userDetails?.plan : "basic";

        // Check if user has used all credits
        if (currentPlan && counter?.usedCreditsCount >= creditLimitsByPlan[currentPlan || "basic"] && !isScriptGeneration) {
            return NextResponse.json({ message: 'You have used all your credits. Please upgrade to continue.', type: "LIMIT_REACHED" }, { status: 200 });
        }

        // Store original message for database
        const originalMessage = message;

        // Enhanced message for AI processing
        let processedMessage = message;

        // Enhance first-time queries with onboarding context
        const isFirstQuery = !historyId;

        //Update answered status last conversation
        const findLastConversation: any = historyId ? await getChatConversationWithLimit({ userId: new ObjectId(userId), historyId: new ObjectId(historyId), }) : {};
        if (findLastConversation?.[0]?._id) {
            await models.ChatConversation.findOneAndUpdate({ _id: findLastConversation?.[0]?._id, isDeleted: false }, { $set: { isAnswered: true } }, { new: true });
        }

        const findHistoryRecord = historyId ? await getChatHistoryById(historyId) : {};
        let historyNewRecord: any = {};
        if (!findHistoryRecord?._id) {
            historyNewRecord = await createChatHistory({ userId, title: "New Chat", timestamp: new Date().toISOString() });

            // Update Last History Id in User
            await updateOneUser("_id", new ObjectId(userId), { lastConversationHistoryId: new ObjectId(historyNewRecord?._id) });
        }

        const newHistoryId = historyId || historyNewRecord?._id;

        // Save original message to database
        const messageData: any = {
            userId: new ObjectId(userId),
            message: originalMessage,  // Save original message to database
            senderId,
            timestamp,
            historyId: newHistoryId
        }
        if (!isInitialPrompt) {
            await createChatConversation(messageData);
        }

        // Fetch current conversation history
        const findConversationHistory = newHistoryId ? await getChatConversationWithLimitFields({ userId: new ObjectId(userId), historyId: new ObjectId(newHistoryId) }) : [];

        // Fetch additional recent conversations from the user (across all chats)
        const allRecentUserConversations = await getAllUserRecentConversations(new ObjectId(userId), 30);

        // Combine both conversation sets and format them
        // First add current conversation history
        const currentConversationMessages = findConversationHistory?.length > 1
            ? findConversationHistory?.reverse().slice(0, -1).map(formatAiAndHumanMessages)
            : [];

        // Then add previous conversations from other chats (if not already in current conversation)
        const previousHistoryIds = findConversationHistory.map((conv: any) => conv._id.toString());
        const previousConversations = allRecentUserConversations
            .filter((conv: any) =>
                // Only include messages from different histories and not already in current conversation
                (!findConversationHistory.some((current: any) => current._id.toString() === conv._id.toString())) &&
                (conv.historyId.toString() !== newHistoryId.toString())
            )
            .reverse()
            .slice(0, 20) // Limit to 20 previous messages from other chats
            .map(formatAiAndHumanMessages);

        // Combine the messages, with current conversation first, then previous conversations
        const formattedPreviousMessages = isFirstQuery ? [...previousConversations, ...currentConversationMessages] : currentConversationMessages;

        // Check for content moderation on the original message
        const violationMessage = await handleModeration(originalMessage);
        if (violationMessage) {
            const messageData: any = {
                userId: new ObjectId(userId),
                message: violationMessage,
                senderId: "aibot",
                timestamp: new Date().toISOString(),
                isQuestion: false,
                isIdeaScript: false,
                historyId: historyId
            }

            await createChatConversation(messageData);

            if (userDetails?.isLastReplyQue) {
                await updateOneUser("_id", new ObjectId(userId), { isLastReplyQue: false, isLastReplyIdeaScript: false });
            }

            return NextResponse.json({ messageData });
        }

        // Pass combined chat history dynamically here
        // STRICT SORTING: Enforce Oldest -> Newest order based on timestamp
        const chatHistory = formattedPreviousMessages.sort((a: any, b: any) => {
            const dateA = new Date(a.content.match(/\[Date: (.*?)\]/)?.[1] || 0).getTime();
            const dateB = new Date(b.content.match(/\[Date: (.*?)\]/)?.[1] || 0).getTime();
            return dateA - dateB;
        });

        // Check and trigger credit alerts before LLM call
       // await checkAndTriggerCreditAlerts();

        // 💉 AGGRESSIVE CONTEXT INJECTION
        // Force-feed the latest topic to the AI to prevent "Semantic Reversion"
        const lastMessage = chatHistory[chatHistory.length - 1];
        if (lastMessage && lastMessage._getType() === 'ai') {
            const messageContent = lastMessage.content;
            let contentText = '';

            if (typeof messageContent === 'string') {
                contentText = messageContent;
            } else if (Array.isArray(messageContent)) {
                contentText = messageContent.map((c: any) => c.text || '').join(' ');
            }

            // Extract content, remove timestamp, take first 200 chars to identify topic
            const contentSnippet = contentText.replace(/\[Date: .*?\]\s*/, '').substring(0, 200).replace(/\n/g, ' ');

            processedMessage += `\n\n[SYSTEM CONTEXT INJECTION: The user is continuing from THIS topic: "${contentSnippet}...". If the user request is vague or asks for a format change, APPLY IT TO THIS TOPIC. DO NOT REVERT to older topics.]`;
        }

        // Execute the agent and return a response, using processedMessage for AI
        const responseData = await executeAgent({
            message: processedMessage,  // Use the processed message with context for AI
            chatHistory,
            userId,
            historyId: newHistoryId,
            fullChatHistory: findConversationHistory?.length > 1 ? findConversationHistory?.reverse().slice(0, -1) : [],
            isFirstQuery: isFirstOnboardingQuery,
            isInitialPrompt,
            isScriptGeneration
        }) as any;

        // When First Response created for current History
        if (!findHistoryRecord?._id) {
            await updateOneChatHistoryRecord("_id", newHistoryId, {
                title:
                    responseData?.responseMessage?.length > 40
                        ? responseData?.responseMessage.slice(0, 40) + "..."
                        : responseData?.responseMessage,
                timestamp: new Date().toISOString(),
            });
        }

        if (!isScriptGeneration) await updateCounter(userId, "usedCreditsCount");

        return NextResponse.json({ messageData: responseData });
    } catch (error) {
        console.error("Error in handler:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export const POST = (req: NextRequest) => apiHandler(req, handler);