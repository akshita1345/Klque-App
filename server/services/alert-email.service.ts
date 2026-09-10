import { emailTemplates } from "@/server/helpers/emails/templates";
import { sendEmail } from "@/utils/email";
import { AlertType } from "@/server/db/mongodb/alert-notification/alert-notification.model";
import { ALERT_RECIPIENTS } from "@/constant/alert.constant";

interface AlertEmailProps {
    type: AlertType;
    totalCredit?: number;
    totalUsage?: number;
    remainingPercentage?: string;
    errorMessage?: string;
}

/**
 * Service to deliver system alert emails to the configured recipients.
 */
export const sendAlertEmail = async ({
    type,
    totalCredit,
    totalUsage,
    remainingPercentage,
    errorMessage
}: AlertEmailProps) => {
    try {
        const ENDPOINT_URL = process.env.ENDPOINT_URL || "http://localhost:3000";
        
        const html = emailTemplates.alertNotification({
            type,
            totalCredit,
            totalUsage,
            remainingPercentage,
            errorMessage,
            ENDPOINT_URL
        });

        const subject = `[KLQUE Alert] ${type}: OpenRouter Credits Status`;

        // Send to all configured recipients
        const results = await Promise.all(
            ALERT_RECIPIENTS.map(to => sendEmail({ to: to ?? '', subject, html }))
        );

        return {
            success: true,
            results
        };
    } catch (error: any) {
        console.error("Error in AlertEmailService:", error.message);
        throw error;
    }
};
