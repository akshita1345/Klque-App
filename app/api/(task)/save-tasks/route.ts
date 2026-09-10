import { NextRequest, NextResponse } from 'next/server';
import authMiddleware from '@/utils/authMiddleware';
import { insertMultiTask, findTask } from '@/server/db/mongodb/task/task.query';
import { findContent } from '@/server/db/mongodb/content/content.query';
import mongoose from 'mongoose';
import moment from 'moment';
import { getChatConversationWithLimit, updateOneConversation, createChatConversation } from '@/server/db/mongodb/chat-conversation/chat-conversation.query';
import SendInvites from '@/server/functions/sendInvites';

const { ObjectId } = mongoose.Types;

async function handler(req: NextRequest, user: any) {
  try {
    if (!user || !user._id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user._id;
    const { tasks, messageId, timezone } = await req.json();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: 'No tasks provided' }, { status: 400 });
    }

    const newTasks = [], invitees = [];
    let duplicatesSkipped = 0;
    let invalidTaskDates = [];
    let scriptsNotFound = [];
    const processedTasks = [];

    const [currentMessage]: any = await getChatConversationWithLimit({
      _id: new ObjectId(messageId),
      userId
    });

    // Process tasks
    for (const task of tasks) {
      // Validate task data
      if (!task.title || !task.priority || !task.dueDate) {
        continue; // Skip invalid tasks
      }

      // Find associated content script
      const associatedContent = await findContent({ userId, historyId: currentMessage?.historyId, scriptId: task?.scriptId });
      if (!associatedContent?.id) {
        scriptsNotFound.push(task?.scriptId);
        continue;
      }

      // Check for duplicate tasks
      const existing = await findTask({
        userId,
        contentId: associatedContent?.id,
        title: task.title,
        isDeleted: false
      });

      if (existing?.id) {
        duplicatesSkipped++;
        continue;
      }

      // Validate due date
      if (moment.tz(task.dueDate, timezone).isBefore(moment().startOf('day'))) {
        invalidTaskDates.push({ date: task.dueDate, title: task.title });
        continue;
      }

      // Prepare task for insertion
      const newTask: {
        userId: string;
        title: string;
        priority: string;
        date: string;
        contentId?: string;
        scriptId?: string;
      } = {
        userId,
        contentId: associatedContent.id,
        scriptId: task.scriptId,
        title: task.title,
        priority: task.priority,
        date: task.dueDate,
      };
      newTasks.push(newTask);

      // Collect task details for AI chat message
      processedTasks.push({
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        scriptId: task.scriptId,
        scriptTitle: associatedContent.title || 'Untitled Script'
      });
    }

    if (scriptsNotFound.length > 0) {
      return NextResponse.json({
        error: 'Scripts not found',
        scriptsNotFound
      }, { status: 400 });
    }

    // Handle validation errors
    if (invalidTaskDates.length > 0) {
      return NextResponse.json({
        error: 'Invalid due dates',
        invalidDates: invalidTaskDates
      }, { status: 400 });
    }

    if (newTasks.length === 0) {
      return NextResponse.json({
        message: 'No new tasks to add',
        duplicatesSkipped
      }, { status: 200 });
    }

    // Insert new tasks
    const inserted = await insertMultiTask(newTasks);

    if (inserted?.length > 0 && user.taskInvites) {
      for (let i = 0; i < inserted.length; i++) {
        const task = inserted[i];
        SendInvites({
          id: task?.id || task?._id,
          to: user.email,
          subject: "New task scheduled",
          summary: `${task.title}`,
          description: `${task.title}`,
          ...(task?.date && {
            start: task?.date,
            end: moment.tz(task?.date, timezone).add(30, "minutes").toISOString(),
          }),
          location: `${process.env.ENDPOINT_URL}/plan?contentId=${task?.contentId}`,
          attendees: [
            //   { email: "recipient@example.com", name: "Recipient Name", rsvp: true }
          ],
          action: "create",
          allDay: false,
          timezone
        })
      }
    }

    for (let i = 0; i < currentMessage?.generatedTasks.length; i++) {
      const element = currentMessage?.generatedTasks?.[i];
      const currentTask = newTasks?.some((item: any) => item.title === element.content && item?.scriptId === element?.scriptId);
      if (currentTask) {
        element.isSaved = true;
      }
    }

    await updateOneConversation("_id", new ObjectId(messageId), {
      generatedTasks: currentMessage?.generatedTasks
    });

    // Generate dynamic AI chat message for multiple scripts
    const uniqueScripts: string[] = Array.from(new Set(processedTasks.map(task => task.scriptId)));
    const tasksCount = inserted.length;

    // Group tasks by script and get titles
    const scriptGroups: Record<string, { title: string; count: number }> = {};
    await processedTasks.forEach(async task => {
      if (!scriptGroups[task.scriptId]) {
        const content = await findContent({ userId, historyId: currentMessage?.historyId, scriptId: task.scriptId });
        scriptGroups[task.scriptId] = {
          title: content?.ideaTitle || 'Untitled Script',
          count: 0
        };
      }
      scriptGroups[task.scriptId].count++;
    });

    let scriptSummary = '';
    if (uniqueScripts.length === 1) {
      const content = await findContent({ userId, historyId: currentMessage?.historyId, scriptId: uniqueScripts?.[0] });
      scriptSummary = `${content?.ideaTitle || 'Untitled Script'}`;
    } else {
      const scriptTitles = Object.values(scriptGroups).map(group => group.title);
      scriptSummary = `${uniqueScripts.length} scripts: ${scriptTitles.join(', ')}`;
    }

    const aiMessage = `🚀 Fantastic! Your action plan is locked and loaded!
📋 Tasks successfully created for ${scriptSummary}:

✅ ${tasksCount} task${tasksCount > 1 ? 's' : ''} added to your plan
✅ Priorities set and deadlines scheduled
✅ Ready for execution!

**🎯 Want to create tasks for another script, or ready to generate some new ideas?**`;

    // Create AI chat conversation
    try {
      await createChatConversation({
        userId,
        historyId: currentMessage?.historyId,
        message: aiMessage,
        role: 'assistant',
        senderId: "aibot",
        generatedTasks: [],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error creating AI chat conversation:', error);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${inserted.length} task(s) to your plan`,
      duplicatesSkipped,
      tasksAdded: inserted.length,
      processedTasks
    }, { status: 200 });

  } catch (error) {
    console.error('Error saving tasks:', error);
    return NextResponse.json({ error: 'Failed to save tasks' }, { status: 500 });
  }
}

export const POST = (req: NextRequest) => authMiddleware(req, handler);