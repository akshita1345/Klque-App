import { Types } from "mongoose";

export interface SessionInput {
    token?: string,
    type?: string,
    emailCounter?: number,
    userId?: Types.ObjectId
}