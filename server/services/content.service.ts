import { CONTENT_ERROR, INVALID_DATE, INVALID_PARAMS, USER_ERROR } from "@/constant/error-messages";
import { CreateContentInput, UpdateContentInput } from "@/types/modules/content.type";
import mongoose from "mongoose";
import { createContent, deleteOneContent, getContentById, getContentsByDate, updateOneContent } from "../db/mongodb/content/content.query";
import { getUserById, updateOneUser } from "../db/mongodb/user/user.query";
import { handleServiceError } from "@/utils/handleServiceError";
import { models } from "../db/mongodb";
import { createChatHistory } from "../db/mongodb/chat-conversation/chat-conversation.query";
import moment from "moment-timezone";

const { ObjectId } = mongoose.Types;

/**
 * Get content list with filtering by type and counts of different content categories
 * @param userId - The user ID to fetch content for
 * @param type - Filter type: 'completed', 'unscheduled', or any other value for scheduled content
 * @param date - Optional date filter
 * @param filters - Optional additional filters (contentPillars, contentTypes, platforms, audiences)
 * @returns Object containing filtered content data and counts for different categories
 */
interface ContentFilters {
  contentPillars?: string[];
  contentTypes?: string[];
  platforms?: string[];
  audiences?: string[];
  [key: string]: any;
}

export const getContentListService = async (userId: string, type: string, date: string | null, filters: ContentFilters = {}, timezone: string, from: string) => {
  try {
    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(INVALID_PARAMS);
    }

    // Check if user exists
    const user = await getUserById(userId);
    if (!user) {
      throw new Error(USER_ERROR.NOT_FOUND);
    }

    // Common filter conditions
    const userIdObj = new ObjectId(userId);
    const baseFilter = { userId: userIdObj, isDeleted: false };
    const notCompletedFilter = { $or: [{ isCompleted: false }, { isCompleted: { $exists: false } }] };

    // Define match conditions based on type
    let typeFilter = {}, dateRangeFilter = {};
    if (type === "completed") {
      typeFilter = { isCompleted: true };
    } else if (type === "unscheduled") {
      typeFilter = {
        ...notCompletedFilter,
        postingDate: { $in: [null, "", undefined] }
      };
    } else if (type === "history") {
      dateRangeFilter = {
        postingDate: {
          $lte: moment().tz(timezone).startOf('day').toDate() // End of yesterday
        }
      };
      typeFilter = {
        postingDate: { $ne: null }
      };
    } else {
      typeFilter = notCompletedFilter;
      if (from === "calendar") {
        typeFilter = {};
      } else {
        dateRangeFilter = {
          postingDate: {
            $gte: moment().tz(timezone).startOf('day').toDate() // Start of today
          }
        };
      }
    }

    // Apply additional filters if provided
    let additionalFilters: Record<string, any> = {};

    // Handle contentPillars filter
    if (filters.contentPillars && Array.isArray(filters.contentPillars) && filters.contentPillars.length > 0) {
      additionalFilters.contentPillar = { $in: filters.contentPillars };
    }

    // Handle contentTypes filter
    if (filters.contentTypes && Array.isArray(filters.contentTypes) && filters.contentTypes.length > 0) {
      additionalFilters.contentType = { $in: filters.contentTypes };
    }

    // Handle platforms filter
    if (filters.platforms && Array.isArray(filters.platforms) && filters.platforms.length > 0) {
      additionalFilters.platform = { $in: filters.platforms };
    }

    // Handle audiences filter
    if (filters.audiences && Array.isArray(filters.audiences) && filters.audiences.length > 0) {
      additionalFilters.audience = { $in: filters.audiences };
    }

    // Build aggregation pipeline with improved readability
    const aggregatePipeline = [
      {
        $match: {
          ...baseFilter,
          ...typeFilter,
          ...additionalFilters,
          ...dateRangeFilter,
        }
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "contentId",
          as: "tasks"
        }
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    ] as any[];

    let dateFilter = {};

    // Add date filter if date parameter is provided
    if (date) {
      try {

        const parsedDate = moment.tz(date, 'YYYY-MM-DD', timezone);
        if (!parsedDate.isValid()) throw new Error("Invalid date format");

        // Get start and end of day in UTC
        const startOfDay = parsedDate.clone().startOf('day');
        const endOfDay = parsedDate.clone().endOf('day');

        dateFilter = {
          postingDate: {
            $gte: startOfDay.toDate(),
            $lte: endOfDay.toDate()
          }
        };

        // Insert date filter at the beginning of the pipeline
        aggregatePipeline.unshift({ $match: dateFilter });
      } catch (error) {
        throw new Error(INVALID_DATE);
      }
    }

    // Execute main query and count queries in parallel for better performance
    const [
      data,
      scheduledContents,
      unScheduledContents,
      completedContents,
      historyContents
    ] = await Promise.all([
      models.Content.aggregate(aggregatePipeline),
      models.Content.aggregate([
        { $match: dateFilter },
        {
          $match: {
            ...baseFilter, ...notCompletedFilter, ...additionalFilters,
            postingDate: {
              $gte: moment().tz(timezone).startOf('day').toDate() // Start of today
            }
          }
        },
        { $count: "count" }
      ]),
      models.Content.aggregate([
        { $match: dateFilter },
        {
          $match: {
            ...baseFilter,
            ...notCompletedFilter,
            ...additionalFilters,
            postingDate: { $in: [null, "", undefined] }
          }
        },
        { $count: "count" }
      ]),
      models.Content.aggregate([
        { $match: dateFilter },
        {
          $match: {
            ...baseFilter,
            ...additionalFilters,
            isCompleted: true
          }
        },
        { $count: "count" }
      ]),
      models.Content.aggregate([
        { $match: dateFilter },
        {
          $match: {
            ...baseFilter,
            ...additionalFilters,
            postingDate: { $lte: moment().tz(timezone).startOf('day').toDate() }
          }
        },
        { $count: "count" }
      ])
    ]);

    return {
      data,
      counts: {
        scheduledCount: scheduledContents?.[0]?.count || 0,
        unScheduledCount: unScheduledContents?.[0]?.count || 0,
        completedCount: completedContents?.[0]?.count || 0,
        historyCount: historyContents?.[0]?.count || 0
      }
    };
  } catch (error) {
    return handleServiceError(error);
  }
}
/**
 * Get content by ID with associated tasks
 * @param contentId - The content ID to fetch
 * @returns Content object with associated tasks
 */
export const getContentByIdService = async (contentId: string) => {
  try {
    // Validate content ID format
    if (!mongoose.Types.ObjectId.isValid(contentId)) {
      throw new Error(INVALID_PARAMS);
    }

    // Build aggregation pipeline to fetch content with tasks
    const aggregatePipeline = [
      {
        $match: {
          _id: new ObjectId(contentId),
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "contentId",
          as: "tasks"
        }
      }
    ] as any[];

    // Execute query and get first result
    const [content] = await models.Content.aggregate(aggregatePipeline);
    if (!content) {
      throw new Error(CONTENT_ERROR.NOT_FOUND);
    }

    return content;
  } catch (error) {
    return handleServiceError(error);
  }
}

/**
 * Create new content with associated chat history
 * @param input - Content creation input data
 * @returns Boolean indicating success
 */
export const createContentService = async (input: CreateContentInput) => {
  try {
    // Validate user ID format
    if (!input?.userId || !mongoose.Types.ObjectId.isValid(input.userId)) {
      throw new Error(INVALID_PARAMS);
    }

    // Check if user exists
    const user = await getUserById(input.userId);
    if (!user) {
      throw new Error(USER_ERROR.NOT_FOUND);
    }

    // Create history record with truncated hook as title
    // const historyTitle = input.hook?.slice(0, 40) || 'New Content';
    // const historyNewRecord = await createChatHistory({
    //   userId: input.userId,
    //   title: historyTitle,
    //   timestamp: new Date().toISOString()
    // });

    // // Update user with reference to latest conversation history
    // await updateOneUser(
    //   "_id",
    //   new ObjectId(user._id),
    //   { lastConversationHistoryId: new ObjectId(historyNewRecord._id) }
    // );

    // Create new content with history reference
    const newContent = await createContent({
      ...input,
      isSelfCreated: true,
      // historyId: historyNewRecord._id
    });

    return newContent;
  } catch (error) {
    return handleServiceError(error);
  }
};

/**
 * Update existing content
 * @param input - Content update input data with contentId
 * @returns Boolean indicating success
 */
export const updateContentService = async (input: UpdateContentInput) => {
  try {
    // Validate content ID format
    if (!input?.contentId || !mongoose.Types.ObjectId.isValid(input.contentId)) {
      throw new Error(INVALID_PARAMS);
    }

    // Check if content exists before updating
    const contentIdObj = new ObjectId(input.contentId);
    const existingContent = await getContentById(contentIdObj);
    if (!existingContent) {
      throw new Error(CONTENT_ERROR.NOT_FOUND);
    }

    // Extract contentId and prepare update data
    const { contentId, ...updateInput } = input;

    // Update content and return success status
    const update = await updateOneContent("_id", contentIdObj, updateInput);
    return { update, existingContent };
  } catch (error) {
    return handleServiceError(error);
  }
};
/**
 * Delete content by ID (soft delete)
 * @param contentId - ID of content to delete
 * @returns Boolean indicating success
 */
export const deleteContentService = async (contentId: string) => {
  try {
    // Validate content ID format
    if (!contentId || !mongoose.Types.ObjectId.isValid(contentId)) {
      throw new Error(INVALID_PARAMS);
    }

    // Check if content exists before deleting
    const contentIdObj = new ObjectId(contentId);
    const existingContent = await getContentById(contentIdObj);
    if (!existingContent) {
      throw new Error(CONTENT_ERROR.NOT_FOUND);
    }

    // Perform soft delete and return result
    const deleteRes = await deleteOneContent(contentIdObj);
    return deleteRes;
  } catch (error) {
    return handleServiceError(error);
  }
}

/**
 * Get contents by specific date for a user
 * @param date - Date string to filter contents by
 * @param userId - User ID to filter contents by
 * @returns Array of content objects for the specified date
 */
export const getContentsByDateService = async (date: string, userId: string) => {
  try {
    // Validate required parameters
    if (!date) throw new Error(INVALID_DATE);
    if (!userId) throw new Error(INVALID_PARAMS);

    // Validate user ID format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(INVALID_PARAMS);
    }

    // Validate date format
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) throw new Error(INVALID_DATE);

    // Fetch contents for the specified date and user
    const contents = await getContentsByDate(date, userId);

    return contents;
  } catch (error) {
    return handleServiceError(error);
  }
};