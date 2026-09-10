import jwt from 'jsonwebtoken';
import { getUser } from '../db/mongodb/user/user.query';
import mongoose from 'mongoose';
import { models } from '../db/mongodb';
import { CallbackHandler } from "langfuse-langchain";

interface Payload {
  _id: string;
  email: string;
  iat?: number;
  exp?: number;
}
const { AUTH_SECRET_KEY } = process.env

const SECRET = AUTH_SECRET_KEY || "";

export const checkToken = async (req: Request): Promise<any | null> => {
  try {
    let token = req.headers.get('authorization');
    if (token) {
      // IF TRY FROM OLD SESSION OR WITHOUT SESSION 
      const isToken = await models.Session.findOne({ token });
      if (!isToken) return null;

      const decoded = jwt.verify(token, SECRET) as Payload;
      const user = await getUser({
        _id: new mongoose.Types.ObjectId(decoded._id),
        isDeleted: false
      });
      return user || null;
    }
  } catch (e: any) {
    const error = new Error("Session Invalid or expired.");
    (error as any).extensions = { code: "UNAUTHENTICATED_ERROR" };
    throw error;
  }
  return null;
};

export const issueNewToken = (payload: Payload | null): string | null => {
  if (!payload) {
    return null;
  }

  const { iat, exp, ...restPayload } = payload;
  const token = jwt.sign(restPayload, SECRET, { algorithm: 'HS512', expiresIn: process.env.TOKEN_EXPIRES_IN });

  return token;
};


// Initialize Langfuse callback handler
export const langfuseHandler = new CallbackHandler({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL
});
