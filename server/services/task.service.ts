import { TASK, USER_ERROR } from "@/constant/error-messages";
import { CreateTaskInput, UpdateTaskInput } from "@/types/modules/task.type";
import { handleServiceError } from "@/utils/handleServiceError";
import mongoose from "mongoose";
import { getContents, updateOneContent } from "../db/mongodb/content/content.query";
import { createTask, deleteOneTask, getTaskById, getTasks, getTasksByDate, updateOneTask } from "../db/mongodb/task/task.query";
import { getUserById } from "../db/mongodb/user/user.query";

const { ObjectId } = mongoose.Types;

export const createTaskService = async (input: CreateTaskInput) => {
  try {
    // CHECK IF USER IS AVAILABLE
    const user: any = await getUserById(input?.userId);
    if (!user) {
      throw new Error(USER_ERROR.NOT_FOUND);
    }
    // CREATE NEW CONTENT
    const newContent = await createTask(input);
    return newContent;
  } catch (error: any) {
    handleServiceError(error);
  }
};
export const updateTaskService = async (input: UpdateTaskInput) => {
  try {
    const existingTask = await getTaskById(new ObjectId(input?.taskId));
    if (!existingTask) {
      throw new Error(TASK.NOT_FOUND);
    }
    const { taskId, ...updateInput } = input;
    const update = await updateOneTask("_id", new ObjectId(taskId), updateInput);
    return { update, existingTask };
  } catch (error: any) {
    handleServiceError(error)
  }
};
export const deleteTaskService = async (taskId: string) => {
  try {
    const existingTask = await getTaskById(new ObjectId(taskId));
    if (!existingTask) {
      throw new Error(TASK.NOT_FOUND);
    }
    const deleteRes = await deleteOneTask(new ObjectId(taskId));
    return deleteRes;
  } catch (error: any) {
    handleServiceError(error)
  }
}

export const getTasksService = async (userId: string) => {
  try {
    if (!userId) throw new Error("User ID is required");
    return await getTasks({ userId: new ObjectId(userId) });
  } catch (error: any) {
    handleServiceError(error);
  }
};

export const getTasksByDateService = async (date: string[], userId: string, timezone: string) => {
  try {
    if (!date || date.length === 0) throw new Error("Date parameter is required");
    if (!userId) throw new Error("User ID is required");
    let tasksList: any = {};

    for (const d of date) {
      const dateObj = new Date(d);
      if (isNaN(dateObj.getTime())) throw new Error("Invalid date format");

      // Fetch tasks using single date and userId (ignoring time)
      const tasks = await getTasksByDate(d, userId, timezone);
      tasksList[d] = tasks;
    }

    return tasksList;
  } catch (error: any) {
    handleServiceError(error);
  }
};
