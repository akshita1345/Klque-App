import crypto from "crypto";
import moment from "moment";

/**
 * Generates a numeric OTP of the specified length (default 6).
 */
export function generateOTP(length: number = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}

/**
 * Generates a secure random token for email verification.
 * Default length is 32 bytes (64 hex characters).
 */
export function generateVerificationToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Checks if the difference between the given datetime string and now is less than 10 minutes.
 * @param {string} dateTimeString - The datetime string to compare (e.g., 2025-07-23T05:37:49.000+00:00)
 * @returns {boolean} - True if the difference is less than 10 minutes, false otherwise.
 */
export function isWithinTenMinutes(dateTimeString: string): boolean {
  const inputTime = moment(dateTimeString);
  const now = moment();
  const diffMinutes = Math.abs(now.diff(inputTime, 'minutes'));
  return diffMinutes < 10;
} 