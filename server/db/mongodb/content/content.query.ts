import moment from "moment";
import { models } from "..";

export const getContentById = async (_id: any) => await models?.Content.findById({ _id, isDeleted: false });

export const getContents = async (arg: object) => await models?.Content.find({ ...arg, isDeleted: false }).sort({ createdAt: -1 });

export const getContentByLimit = async (arg: object, limit: number) => await models?.Content.find({ ...arg, isDeleted: false }).sort({ createdAt: -1 }).limit(limit || 1);

export const findContent = async (arg: object) => await models?.Content.findOne({ ...arg, isDeleted: false });

export const updateOneContent = async (filterKey: string, filter: any, update: any) => await models.Content.findOneAndUpdate({ [filterKey]: filter, isDeleted: false }, { $set: update }, { new: true });

export const deleteOneContent = async (_id: any) => {
  const res = await models.Content.findOneAndUpdate({ _id }, { $set: { isDeleted: true } }, { new: true });
  return res;
}

export const createContent = async (data: any) => {
  const newContent = await models.Content.create(data);
  return newContent.toObject();
}

export const insertMultiContent = async (data: any[]) => {
  const newContent = await models.Content.insertMany(data);
  return newContent;
}


export const getContentsByDate = async (date: string, userId: string) => {
  // Validate and parse the input date
  const parsedDate = moment(date, 'YYYY-MM-DD');
  if (!parsedDate.isValid()) throw new Error("Invalid date format");

  // Get start and end of day in UTC
  const startOfDay = parsedDate.clone().startOf('day').utc();
  const endOfDay = parsedDate.clone().endOf('day').utc();

  return await models?.Content.find({
    date: { $gte: startOfDay.toDate(), $lte: endOfDay.toDate() },
    userId: userId,
    isDeleted: false
  }).sort({ createdAt: -1 });
};