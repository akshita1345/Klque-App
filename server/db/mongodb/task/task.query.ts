import { models } from "..";
import moment from 'moment-timezone';

export const getTaskById = async (_id: any) => await models?.Task.findById({ _id, isDeleted: false });

export const getTasks = async (arg: object) => await models?.Task.find({ ...arg, isDeleted: false }).sort({ createdAt: -1 });

export const findTask = async (arg: object) => await models?.Task.findOne({ ...arg, isDeleted: false });

export const findTasksWithSelection = async (arg: object, select: string) => await models?.Task.find({ ...arg, isDeleted: false }).select(select).sort({ createdAt: -1 });

export const updateOneTask = async (filterKey: string, filter: any, update: any) => await models.Task.findOneAndUpdate({ [filterKey]: filter, isDeleted: false }, { $set: update }, { new: true });

export const deleteOneTask = async (_id: any) => {
  const res = await models.Task.findByIdAndUpdate({ _id }, { $set: { isDeleted: true } }, { new: true });
  return res;
}

export const createTask = async (data: any) => {
  const newTask = await models.Task.create(data);
  return newTask.toObject();
}

export const insertMultiTask = async (data: any[]) => {
  const newTask: any = await models.Task.create(data);
  return newTask?.toObject ? newTask?.toObject() : newTask;
}

export const getTasksByDate = async (date: string, userId: string, timezone: string) => {

  // Validate and parse the input date
  const parsedDate = moment.tz(date, 'YYYY-MM-DD', timezone);
  if (!parsedDate.isValid()) throw new Error("Invalid date format");

  // Get start and end of day in UTC
  const startOfDay = parsedDate.clone().startOf('day').utc();
  const endOfDay = parsedDate.clone().endOf('day').utc();

  const data = await models?.Task.find({
    date: { $gte: startOfDay.toDate(), $lte: endOfDay.toDate() },
    userId,
    isDeleted: false
  }).sort({ createdAt: -1 });
  return data;
};
