import { ProfileSummary } from "./profileSummary.model";

export const getProfileSummary = async (userId: string) => {
    return await ProfileSummary.findOne({ userId });
}

export const createProfileSummary = async (profileSummary: any) => {
    return await ProfileSummary.create(profileSummary);
}

export const getLastProfileSummary = async (userId: string) => {
    return await ProfileSummary.findOne({ userId }).sort({ createdAt: -1 });
}