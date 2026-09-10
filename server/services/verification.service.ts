import { getUser, getUserByEmail, getUserById, updateOneUser } from "../db/mongodb/user/user.query";
import { sendEmail } from "@/utils/email";
import mongoose from "mongoose"
import { GENERAL_ERROR, USER_ERROR, VERIFICATION_ERROR } from "@/constant/error-messages";
import { generateOTP, generateVerificationToken, isWithinTenMinutes } from "@/utils/otpAndToken";
import moment from "moment";
import { deleteSessionRecord, findSession } from "../db/mongodb/session/session.query";
import { emailNotification } from "../helpers/emails/email.helper";
import { models } from "../db/mongodb";
import { AUTH } from "@/constant/toast-message";
const ObjectId = mongoose.Types.ObjectId;


export const sendVerificationEmailService = async (email: string) => {
  const user = await getUserByEmail(email);

  if (!user) throw new Error(USER_ERROR.NOT_FOUND);
  if (user.emailVerified) return { message: "Already verified" };

  const verificationToken = generateVerificationToken(32);
  const otp = generateOTP(6)

  await updateOneUser("email", user.email, {
    emailVerificationToken: verificationToken,
    otp: otp,
    verificationSecretTime: moment().format('YYYY-MM-DD HH:mm:ss')
  });

  const verificationUrl = `${process.env.ENDPOINT_URL}/validate-verification?token=${verificationToken}`;

  // Send Email Verification
  await emailNotification({ link: verificationUrl, code: otp, email: user?.email }, "email-verification");
  return { message: "Verification email sent" };
};

export const verifyEmailService = async (email?: string, token?: string, otp?: string) => {
  if (!token && !otp) {
    throw new Error(GENERAL_ERROR.SOMETHING_WRONG);
  }

  const user = await getUser({
    $or: [
      ...(token ? [{ emailVerificationToken: token }] : []),
      ...(otp ? [{ email, otp }] : [])
    ]
  });

  if (!user) {
    throw new Error(token ? VERIFICATION_ERROR.INVALID_LINK : VERIFICATION_ERROR.INVALID_OTP);
  }

  if (user.emailVerified) {
    return { message: "Email is already verified" };
  }

  if (!isWithinTenMinutes(user.verificationSecretTime)) {
    throw new Error(VERIFICATION_ERROR.EXPIRED);
  }

  await updateOneUser("_id", user._id, {
    emailVerified: true,
    emailVerificationToken: null,
    otp: null,
    verificationSecretTime: null
  });

  return true;
};



export const sendPasswordResetEmailService = async (email: string) => {
  try {
    // CHECK USER IS AVAILABLE
    const user: any = await getUserByEmail(email?.trim())
    if (!user) {
      return true;
    }

    // FIND SESSION
    const session: any = await findSession({ type: "resetPassword", userId: user?._id })
    if (session?.emailCounter > 2) {
      throw new Error(AUTH.PASSWORD_RESET_LIMIT);
    } else {
      // SEND EMAIL
      const emailNotifyResponse = await emailNotification(user, "forgotPassword");

      if (emailNotifyResponse?.flag) {
        const code = emailNotifyResponse?.data;

        // CREATE OR UPDATE RESETPASSWORD SESSION
        await models.Session.findOneAndUpdate(
          { type: "resetPassword", userId: user?._id },
          {
            $set: { token: code },
            $inc: { emailCounter: 1 }
          },
          { new: true, upsert: true },
        ).exec();

        return true;
      } else return false;
    }
  } catch (error: any) {
    throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG)
  }
};

export const resetPasswordService = async (input: any) => {
  try {
    // CHECK USER IS AVAILABLE
    const user: any = await getUserById(input?._id)

    if (!user) {
      throw new Error(USER_ERROR.NOT_FOUND);
    }

    // VALIDATE RESET PASSWORD CODE EXPIRY
    const session: any = await findSession({ type: "resetPassword", userId: user?._id })
    if (session?.token != input?.code) {
      throw new Error(AUTH.PASSWORD_RESET_LINK_EXPIRE);
    }

    // UPDATE WITH NEW PASSWORD
    user.password = input?.password
    await user?.save()

    // DELETE SESSION RECORD
    await deleteSessionRecord(user?._id)

    return true;

  } catch (error: any) {
    throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG)
  }
};

export const sendConfirmationEmailService = async (userId: any) => {
  const user: any = await getUserById(userId);
  await emailNotification(user, "plan-subscribed");
  return { message: "Verification email sent" };
};