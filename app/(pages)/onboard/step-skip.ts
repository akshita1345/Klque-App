import { apiClient } from "@/client/client";
import { GENERAL_ERROR } from "@/constant/error-messages";

const StepSkip = async (step: number, userId: string) => {
  try {
    return await apiClient("/api/onboard-step-skip", {
      method: "POST",
      body: JSON.stringify({ step, userId }),
    });
  } catch (error: any) {
    throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG)
  }
}

export default StepSkip;