import { GENERAL_ERROR } from "@/constant/error-messages";

// Centralized error handler
export const handleServiceError = (error: unknown): never => {
  if (error instanceof Error) {
    throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG);
  }
  throw new Error(GENERAL_ERROR.SOMETHING_WRONG);
};