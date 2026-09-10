import axios from "axios";
import moment from "moment";
import { models } from "@/server/db/mongodb";
import { sendAlertEmail } from "./alert-email.service";
import { ALERT_THRESHOLDS } from "@/constant/alert.constant";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export interface OpenRouterCredits {
  total_credits: number;
  total_usage: number;
}

/**
 * Fetches current credit information from OpenRouter API
 */
export const getOpenRouterCredits = async (): Promise<OpenRouterCredits> => {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not defined");
    }

    const response = await axios.get("https://openrouter.ai/api/v1/credits", {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
    });

    return response.data.data;
  } catch (error: any) {
    console.error("Error fetching OpenRouter credits:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Calculates the remaining credit percentage
 */
export const calculateRemainingCreditPercentage = (credits: OpenRouterCredits): number => {
  if (credits.total_credits <= 0) return 0;
  const remaining = credits.total_credits - credits.total_usage;
  const percentage = (remaining / credits.total_credits) * 100;
  return Math.max(0, percentage);
};

/**
 * Checks if an email should be sent based on 24-hour cooldown
 */
const shouldSendAlert = (lastEmailSentAt: Date | null): boolean => {
  
  console.log("Checking last email sent...")

  if (!lastEmailSentAt) return true;
  
  const now = moment();
  const lastSent = moment(lastEmailSentAt);
  const hoursDiff = now.diff(lastSent, 'hours', true);
  console.log("Hours difference...", hoursDiff)
  return hoursDiff >= 24;
};

/**
 * Checks credits and triggers alerts if necessary
 */
export const checkAndTriggerCreditAlerts = async () => {
  try {
    const credits = await getOpenRouterCredits();
    const percentage = calculateRemainingCreditPercentage(credits);
    // const percentage = 24
    const remainingStr = percentage.toFixed(2) + "%";

    console.log("Checking and Alerting User... credits, percentage, remainig", credits, percentage, remainingStr)

    let alertType: any = null;

    if (percentage <= ALERT_THRESHOLDS.INCIDENT) {
      alertType = "INCIDENT";
    } else if (percentage <= ALERT_THRESHOLDS.CRITICAL) {
      alertType = "CRITICAL";
    } else if (percentage <= ALERT_THRESHOLDS.WARNING) {
      alertType = "WARNING";
    }

    if (alertType) {
      // Get the most recent alert notification for this alert type
      const existingAlert = await models.AlertNotification.findOne({ alertType })
        .sort({ lastEmailSentAt: -1 });
      
      // Check if email should be sent (24-hour cooldown)
      if (shouldSendAlert(existingAlert?.lastEmailSentAt as Date | null)) {

        console.log("Email sending....")

        // Send the alert email
        await sendAlertEmail({
          type: alertType,
          totalCredit: credits.total_credits,
          totalUsage: credits.total_usage,
          remainingPercentage: remainingStr
        });

        console.log("Inserting alert notification...")
        // Insert alert notification after successful email send
        await models.AlertNotification.create({
          alertType,
          totalCredit: credits.total_credits,
          totalUsage: credits.total_usage,
          lastEmailSentAt: moment().toDate()
        });
      }
    }

    return {
      credits,
      percentage,
      alertTriggered: !!alertType
    };
  } catch (error: any) {
    console.error("Error in checkAndTriggerCreditAlerts:", error.message);
    // Runtime error is already handled in getOpenRouterCredits
    return null;
  }
};