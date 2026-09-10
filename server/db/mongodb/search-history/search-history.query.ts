import moment from "moment-timezone";
import { models } from "..";

export const getSearchQueryByURLOrQuery = async (url?: string | null, query?: string | null) => {
    return await models.SearchHistory.findOne({ $or: (query ? [{ query }] : [{ url }]) })?.lean();
}

// get function by month old data by url
export const getSearchQueryByURLAndMonth = async (url: string, month: number) => {
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    return await models.SearchHistory.find({ url, timestamp: { $gte: thirtyDaysAgo } })?.lean();
}

// custom get function of dynamic filters
export const getSearchQueryByURLAndFilters = async (filters: object) => {
    return await models.SearchHistory.find(filters)?.lean();
}

// create or update search history
export const createOrUpdateSearchHistory = async (data: any) => {
    const response = await models.SearchHistory.findOneAndUpdate({ $or: [data?.url ? { url: data?.url } : { query: data?.query }] }, data, { upsert: true, new: true });
    return response?.toObject();
}