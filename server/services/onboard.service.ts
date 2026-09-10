import { GENERAL_ERROR, USER_ERROR } from "@/constant/error-messages";
import { getUserById, updateOneUser } from "../db/mongodb/user/user.query";
import StartOnboarding from "@/app/(pages)/onboard/start-onboarding/page";

export const onBoardStepService = async (data: any, step: number, userId: string, input?: any) => {
  try {
    // CHECK USER IS AVAILABLE
    const existingUser: any = await getUserById(userId);
    if (!existingUser) {
      throw new Error(USER_ERROR.NOT_FOUND);
    }

    const onBoardingData = data ? (() => {
      switch (step) {
        case 1:
          return { describe: data };
        case 2:
          return { mainGoal: data };
        case 3:
          return { newVibe: data };
        case 4:
          return { businessInfo: data, isPersonal: input?.isPersonal ?? false };
        case 5:
          return { profileSummary: data };
        case 6:
          return { toneVoice: data };
        case 7:
          return { suggestedScripts: data };
        case 8:
          return { StartOnboarding: data };
        case 9:
          return { contentType: data };
        case 10:
          return { goal: data };
        case 11:
          return { vibe: data };
        case 12:
          return { platform: data };
        default:
          return {};
      }
    })() : {};
    await updateOneUser("_id", userId, { onboarding: { ...existingUser?.onboarding, ...onBoardingData }, onboardingStep: step, isOnboarded: step === 11 ? true : false, ...(input || {}) });

    const returnUserRes: any = await getUserById(userId);
    // Define an interface for excluded fields to improve type safety
    interface ExcludedUserFields {
      isOnboarded: boolean;
      emailVerified: boolean;
      emailVerificationToken: string;
      otp: string;
      verificationSecretTime: Date;
      lastConversationHistoryId: string;
      isDeleted: boolean;
      isLastReplyQue: boolean;
      isLastReplyIdeaScript: boolean;
      subscriptionId: string;
      customerId: string;
      status: string;
      plan: string;
      planTime: Date;
      planId: string;
      sessionCode: string;
      expiryDate: Date;
      isSubscriptionCancel: boolean;
      isSubscribed: boolean;
      savedResponseCount: number;
      savedScriptsCount: number;
      selectedPlan: string;
    }

    // Use type assertion to ensure proper typing of returnUserRes
    const {
      isOnboarded,
      emailVerified,
      emailVerificationToken,
      otp,
      verificationSecretTime,
      // lastConversationHistoryId,
      isDeleted,
      isLastReplyQue,
      isLastReplyIdeaScript,
      subscriptionId,
      customerId,
      status,
      // plan,
      planTime,
      planId,
      sessionCode,
      expiryDate,
      isSubscriptionCancel,
      // isSubscribed,
      savedResponseCount,
      savedScriptsCount,
      selectedPlan,
      ...userRes
    } = returnUserRes?._doc as ExcludedUserFields & Record<string, unknown>;

    return userRes;

  } catch (error: any) {
    throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG)
  }
}
export const stepOnboardSkipService = async (step: number, userId: string) => {
  try {
    // CHECK USER IS AVAILABLE
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      throw new Error(USER_ERROR.NOT_FOUND);
    }
    const returnRes = await updateOneUser("_id", userId, { onboardingStep: step, isOnboarded: step === 5 ? true : false });
    return !!returnRes;

  } catch (error: any) {
    throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG)
  }
}