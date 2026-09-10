import { SessionInput } from "@/types/modules/session.type";
import { models } from "..";

export const findSession = async (sessionInput: SessionInput) => {
    return await models.Session.findOne(sessionInput);
}

export const createSession = async (sessionInput: SessionInput) => {
    await models.Session.create(sessionInput);
}

export const deleteSessionRecord = async (userId: any) => {
    await models.Session.deleteMany({ userId })
}