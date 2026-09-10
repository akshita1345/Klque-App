import { GENERAL_ERROR, USER_ERROR } from "@/constant/error-messages";
import { issueNewToken } from "@/server/middleware/middleware";
import { SignInInput, SignUpInput } from "@/types/modules/user.type";
import { createSession } from "../db/mongodb/session/session.query";
import { createUser, getUserByEmail, updateOneUser } from "../db/mongodb/user/user.query";
import { authenticateGoogleOneTap } from "@/utils/passport";
import { User } from "../db/mongodb/user/user.model";
import { generateOTP, generateVerificationToken } from "@/utils/otpAndToken";
import moment from "moment";
import { emailNotification } from "../helpers/emails/email.helper";
import { getChatHistoryList } from "../db/mongodb/chat-conversation/chat-conversation.query";

const verifyEmail = async (user: any) => {

  const token: any = await issueNewToken({ _id: user?._id, email: user?.email });

  await createSession({ token, userId: user?._id, type: "session" });

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

  return { user, token }
}

export const socialAuthentication = async (credential: string, provider: string) => {
  if (provider !== 'google') {
    return
  }
  const auth: any = await authenticateGoogleOneTap(credential);
  const { given_name, family_name = '', email, sub } = auth?.data;
  const name = `${given_name} ${family_name}`
  const password = `klque-${name}-${email}`

  const matchQuery = {
    $or: [
      { email: email },
      { "social.googleProvider.id": sub }
    ],
    isDeleted: false
  };

  let user = await User.findOne(matchQuery)

  if (user && !user.emailVerified) {
    return await verifyEmail(user)
  }

  if (user) {
    const token: any = await issueNewToken({ _id: user?._id, email: user?.email });

    // CREATE USER SESSION
    await createSession({ token, userId: user?._id, type: "session" });

    let returnResponse = { user: user.toObject(), token };

    // Remove the password field
    delete returnResponse.user.password;

    returnResponse.user.hasUsedAppBefore = !!(await getChatHistoryList({ userId: user?._id }, 0, 1))?.[0];

    return returnResponse;
  }

  // CREATE NEW USER
  const newUser = await createUser({
    name, email, password, profession: '',
    emailVerified: true,
    emailVerificationToken: null,
    verificationSecretTime: null,
    social: {
      googleProvider: {
        id: sub,
        token: credential || ""
      }
    }
  });

  const token: any = await issueNewToken({ _id: newUser?._id, email: user?.email });
  await createSession({ token, userId: user?._id, type: "session" });

  // ISSUE A NEW TOKEN
  return { user: newUser, token, message: "User registration completed" }
}

export const signUpService = async (input: SignUpInput) => {
  try {
    // CHECK IF A USER WITH THE PROVIDED EMAIL ALREADY EXISTS
    const existingUser = await getUserByEmail(input.email.trim());
    if (existingUser) {
      throw new Error(USER_ERROR.USER_EXIST);
    }

    // CREATE NEW USER
    const newUser = await createUser(input);

    return await verifyEmail(newUser)
  } catch (error: any) {
    throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG);
  }
};

export const signInService = async (input: SignInInput) => {
  try {
    // CHECK IF USER IS AVAILABLE
    const user: any = await getUserByEmail(input?.email?.trim()?.toLowerCase());
    if (!user) {
      throw new Error(USER_ERROR.NOT_FOUND);
    }
    // PASSWORD VALIDATION
    const isValid = await user.validatePassword(input?.password);
    if (!isValid) {
      throw new Error(USER_ERROR.INVALID_PASSWORD);
    }

    // ISSUE A NEW TOKEN
    const token: any = await issueNewToken({ _id: user?._id, email: user?.email });

    // CREATE USER SESSION
    await createSession({ token, userId: user?._id, type: "session" });

    const returnResponse = { ...user.toObject(), token };

    // Remove the password field
    delete returnResponse.password;

    return returnResponse;

  } catch (error: any) {
    throw new Error(error.message || GENERAL_ERROR.SOMETHING_WRONG);
  }
};