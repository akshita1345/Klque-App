import { ResetPasswordTemplate } from "./reset-password.template";
import { VerificationCodeTemplate } from "./verification-code.template";
import { WelcomeTrialTemplate } from "./welcome-subscribed.template";
import { AlertNotificationTemplate } from "./alert-notification.template";
import { AlertType } from "@/server/db/mongodb/alert-notification/alert-notification.model";

class EmailTemplates {


    verificationCode({ link, code, ENDPOINT_URL }: { link: string; code: number, ENDPOINT_URL: string }) {
        return VerificationCodeTemplate({ link, code, ENDPOINT_URL });
    }

    resetPassword({ userName, link, ENDPOINT_URL }: {
        userName: string; link: string; ENDPOINT_URL: string
    }) {
        return ResetPasswordTemplate({
            userName, link, ENDPOINT_URL
        });
    }
    welcomeTrialTemplate({ userName, ENDPOINT_URL }: {
        userName: string; ENDPOINT_URL: string
    }) {
        return WelcomeTrialTemplate({
            userName, ENDPOINT_URL
        });
    }

    alertNotification(props: {
        type: AlertType;
        totalCredit?: number;
        totalUsage?: number;
        remainingPercentage?: string;
        errorMessage?: string;
        ENDPOINT_URL: string;
    }) {
        return AlertNotificationTemplate(props);
    }
}

export const emailTemplates = new EmailTemplates();