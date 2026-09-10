import { Types } from "mongoose"
export interface IGoogleProvider {
  googleProvider: {
    id: string;
    token: string;
  }
}
export interface QuerySignUpInput {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  profession: string;
  social?: IGoogleProvider,
  emailVerified?: boolean | null,
  emailVerificationToken?: string | null,
  verificationSecretTime?: string | null
}
export interface SignUpInput {
  name: string
  profession: string
  email: string
  password: string
}

export interface SignInInput {
  email: string,
  password: string,
}