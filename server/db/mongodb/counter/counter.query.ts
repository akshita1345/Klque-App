import { models } from "..";
import mongoose from "mongoose";
import moment from "moment";

export const updateCounter = async (userId: any, field: any) => {
    return models.Counter.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: moment().format("YYYY-MM-DD") } },
        { $inc: { [field]: 1 } },
        { upsert: true, new: true }
    );
};

export const getTodayCounter = async (userId: any) => {
    return models.Counter.findOne({ userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: moment().format("YYYY-MM-DD") } });
};

export const getCounterByUserId = async (userId: any) => {
    return models.Counter.findOne({ userId: new mongoose.Types.ObjectId(userId) });
};

export const getCounterByUserIdAndDate = async (userId: any, date: any) => {
    return models.Counter.findOne({ userId: new mongoose.Types.ObjectId(userId), createdAt: { $gte: moment(date).format("YYYY-MM-DD") } });
};
