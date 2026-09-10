import { NextRequest, NextResponse } from 'next/server';
import authMiddleware from '@/utils/authMiddleware';
import { findContent, createContent, updateOneContent } from '@/server/db/mongodb/content/content.query';
import { getUserById, updateOneUser } from '@/server/db/mongodb/user/user.query';
import { getChatConversationWithLimit, updateOneConversation, createChatConversation } from '@/server/db/mongodb/chat-conversation/chat-conversation.query';
import { checkCurrentPlan, scriptLimitsByPlan } from '@/config';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import SendInvites from '@/server/functions/sendInvites';

const { ObjectId } = mongoose.Types;

async function handler(req: NextRequest, user: any) {
    try {
        if (!user || !user._id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const timezone: string = req.nextUrl.searchParams.get('timezone') || "";
        const userId = user._id;
        const { scripts, messageId } = await req.json();

        // Validate input
        if (!Array.isArray(scripts) || scripts.length === 0) {
            return NextResponse.json({ error: 'No valid scripts provided. Please include at least one script to add to your plan.' }, { status: 400 });
        }

        // Arrays to track processing results
        const validScripts = [];
        const updatableScripts = [];
        const invalidPostingDates = [];
        const processedScriptIds = new Set();

        // Get current message for history reference
        let currentMessage: any = null;
        let historyId = null;

        if (messageId) {
            const [message]: any = await getChatConversationWithLimit({
                _id: new ObjectId(messageId),
                userId
            });
            currentMessage = message;
            historyId = currentMessage?.historyId;
        }

        // Process each script
        for (const script of scripts) {
            const { id: scriptId, postingDate, hook, body: contentBody, platform, contentType, ideaTitle, isUpdate } = script;

            // Validate required fields
            if (!scriptId || (!postingDate && !isUpdate) || !hook || !contentBody || !platform || !contentType || !ideaTitle) {
                continue;
            }

            // Validate posting date format and ensure it's in the future
            if (postingDate && !moment.tz(postingDate, timezone).isValid()) {
                invalidPostingDates.push({ scriptId, postingDate });
                continue;
            }

            if (postingDate && !moment.tz(postingDate, timezone).isAfter(moment.tz(timezone).startOf('day'))) {
                invalidPostingDates.push({ scriptId, postingDate });
                continue;
            }

            // Check for existing content by scriptId
            const existing = await findContent({ scriptId, userId, historyId });

            const newObj = {
                scriptId,
                userId,
                historyId: historyId ? new ObjectId(historyId) : null,
                hook,
                script: contentBody,
                platform,
                contentType,
                postingDate: postingDate ? moment.tz(postingDate, timezone).toDate() : existing?.postingDate,
                ideaTitle: ideaTitle,
                targetAudience: "General Audience", // Default value
                focus: "content creation", // Default value
                contentPillar: "Content", // Default value
                CTA: "Share your thoughts in the comments", // Default CTA
                captions: [hook], // Use hook as caption
                hashtags: ["#content", "#socialmedia", "#marketing"] // Default hashtags
            };

            if (existing?.id) {
                updatableScripts.push({ ...existing._doc, ...newObj });
            } else {
                validScripts.push(newObj);
            }

            processedScriptIds.add(scriptId);
        }

        // Handle invalid posting dates
        if (invalidPostingDates.length > 0) {
            return NextResponse.json({
                error: `⚠️ The following scripts have invalid posting dates: ${invalidPostingDates.map(({ scriptId, postingDate }) => `${scriptId} (${postingDate})`).join(', ')}. Please update these dates before adding to your plan.`
            }, { status: 400 });
        }

        // Check if all scripts already exist
        if (validScripts.length === 0 && updatableScripts.length === 0) {
            return NextResponse.json({
                message: `✅ All ${scripts.length} script(s) already exist in your plan. Your content library is up to date!`
            }, { status: 200 });
        }

        // Get user details for plan checking
        const userDetails = await getUserById(userId);
        if (!userDetails) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const currentPlan = checkCurrentPlan(userDetails?.plan, userDetails, userDetails?.planTime === "year") ? userDetails?.plan : "basic";

        // Check plan limits
        const totalNewScripts = validScripts.length + updatableScripts.filter(s => !s.id).length;
        if (currentPlan && (userDetails?.savedScriptsCount || 0) + totalNewScripts > scriptLimitsByPlan[currentPlan || "basic"]) {
            return NextResponse.json({
                type: "LIMIT_REACHED",
                error: 'You have used all your saved scripts limit. Please upgrade to add more scripts.'
            }, { status: 403 });
        }

        let insertedCount = 0;
        let updatedCount = 0;

        // Arrays to store processed scripts for AI message
        const processedScripts: Array<{
            docId?: string;
            scriptId: string;
            title: string;
            postingDate: string;
            isNew: boolean;
        }> = [];

        // Insert new scripts
        for (const script of validScripts) {
            const created = await createContent(script);
            await updateOneUser("_id", new ObjectId(userId), {
                savedScriptsCount: (Number(userDetails?.savedScriptsCount) || 0) + 1
            });
            insertedCount++;

            if (created) {
                processedScripts.push({
                    scriptId: script.scriptId,
                    docId: created?._id?.toString(),
                    title: script.ideaTitle || 'Untitled Script',
                    postingDate: script?.postingDate,
                    isNew: true
                });
            }
        }

        // Update existing scripts
        for (const script of updatableScripts) {
            const { _id, __v, createdAt, updatedAt, ...rest } = script;

            if (_id) {
                await updateOneContent("_id", _id, rest);
                updatedCount++;
                processedScripts.push({
                    docId: _id?.toString(),
                    scriptId: script.scriptId,
                    title: script.ideaTitle || 'Untitled Script',
                    postingDate: script?.postingDate,
                    isNew: false
                });
            } else {
                const created = await createContent(rest);
                await updateOneUser("_id", new ObjectId(userId), {
                    savedScriptsCount: (Number(userDetails?.savedScriptsCount) || 0) + 1
                });
                insertedCount++;
                if (created) {
                    processedScripts.push({
                        docId: created?._id?.toString(),
                        scriptId: script.scriptId,
                        title: script.ideaTitle || 'Untitled Script',
                        postingDate: script?.postingDate,
                        isNew: true
                    });
                }
            }
        }

        // Update conversation if messageId provided
        if (currentMessage && messageId) {
            try {
                const updatedGeneratedScripts = currentMessage.selectPostingDates?.map((script: any) => {
                    if (processedScriptIds.has(script.id)) {
                        return { ...script, isSaved: true };
                    }
                    return script;
                }) || [];

                await updateOneConversation("_id", new ObjectId(messageId), {
                    selectPostingDates: updatedGeneratedScripts
                });
            } catch (error) {
                console.error('Error updating conversation:', error);
                // Continue without failing the entire operation
            }
        }

        // Generate dynamic AI chat message
        if (processedScripts.length > 0) {
            try {
                let aiMessage = "Awesome! 🎉 The ideas\n";
                const invites: any = [];

                processedScripts.forEach((script, index) => {
                    if (user.planInvites)
                        invites.push({
                            id: script.docId,
                            to: user.email,
                            subject: script.isNew ? "New plan scheduled" : "Plan updated",
                            summary: `${script.title}`,
                            description: `${script.title}`,
                            location: `${process.env.ENDPOINT_URL}/plan?contentId=${script.docId}`,
                            allDay: false,
                            ...(script?.postingDate && {
                                start: moment.tz(script?.postingDate, timezone).toISOString(),
                                end: moment.tz(script?.postingDate, timezone).add(30, "minutes").toISOString(),
                            }),
                            action: script.isNew ? "create" : "update",
                            timezone
                        });
                    aiMessage += `**${index + 1}. ${script.title}**\n**Due Date: ${moment.tz(script?.postingDate, timezone).format('HH:mm on MMM DD, YYYY')}**`;
                    if (index < processedScripts.length - 1) {
                        aiMessage += "\n";
                    }
                });

                aiMessage += "\nhas been successfully added to your Calendar.\n**Would you like to generate tasks? give me script id to get this content posted on time?**";

                // Create AI chat conversation
                const historyIdToUse = historyId || new ObjectId().toString();

                await createChatConversation({
                    userId: new ObjectId(userId),
                    historyId: new ObjectId(historyIdToUse),
                    message: aiMessage,
                    timestamp: new Date().toISOString(),
                    // generatedScriptIds: processedScripts.map(s => s.scriptId),
                    generatedDocs: processedScripts,
                    generatedTasks: [],
                    isFailed: false,
                    isAddedToPlan: true,
                    isIdeaScript: false,
                    isQuestion: false,
                    isAnswered: true,
                    responseMessage: aiMessage,
                    senderId: "aibot",
                    isGenerateTaskResponse: true,
                });

                if (invites.length > 0) {
                    invites.forEach((invite: any) => {
                        SendInvites(invite);
                    })
                }
            } catch (error) {
                console.error('Error creating AI chat conversation:', error);
                // Continue without failing the entire operation
            }
        }

        // Build success message
        let resultMessage = `✅ Successfully added ${insertedCount} script${insertedCount !== 1 ? 's' : ''} to your content plan!`;
        if (updatedCount > 0) {
            resultMessage += ` (${updatedCount} updated)`;
        }

        return NextResponse.json({
            success: true,
            message: resultMessage,
            insertedCount,
            updatedCount,
            totalProcessed: scripts.length,
            processedScripts: processedScripts.map(s => ({
                docId: s.docId,
                scriptId: s.scriptId,
                title: s.title,
                postingDate: s.postingDate,
                isNew: s.isNew
            }))
        }, { status: 200 });

    } catch (error) {
        console.error('Script addition error:', error);
        return NextResponse.json({
            error: "Failed to add scripts to your plan. Please try again or contact support if the issue persists."
        }, { status: 500 });
    }
}

export const POST = (req: NextRequest) => authMiddleware(req, handler);