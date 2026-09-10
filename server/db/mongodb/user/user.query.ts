import { QuerySignUpInput } from "@/types/modules/user.type";
import { models } from "..";

export const getUserByEmail = async (email: string) => await models.User.findOne({ email, isDeleted: false });

export const getUserById = async (_id: string) => await models?.User.findById({ _id, isDeleted: false });

export const getUser = async (arg: object) => await models?.User.findOne({ ...arg, isDeleted: false });

export const getAllUsers = async (arg: object) => await models?.User.find({ ...arg, isDeleted: false });

export const updateOneUser = async (filterKey: string, filter: any, update: any) => await models.User.findOneAndUpdate({ [filterKey]: filter, isDeleted: false }, { $set: update },{$new:true});

export const deleteOneUser = async (_id: string) => {
  const res = await models.User.updateOne({ _id }, { $set: { isDeleted: true, availability: "offline" } });
  return !!res;
}

export const createUser = async (userData: QuerySignUpInput) => {
  const newUser = await models.User.create(userData);
  return newUser.toObject();
}

export const aggregatedUsers = async (aggregationPipeline: any) => await models?.User.aggregate(aggregationPipeline);