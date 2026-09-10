import { AlertType } from "@/server/db/mongodb/alert-notification/alert-notification.model";

interface AlertTemplateProps {
    type: AlertType;
    totalCredit?: number;
    totalUsage?: number;
    remainingPercentage?: string;
    errorMessage?: string;
    ENDPOINT_URL: string;
}

export const AlertNotificationTemplate = ({
    type,
    totalCredit,
    totalUsage,
    remainingPercentage,
    errorMessage,
    ENDPOINT_URL
}: AlertTemplateProps) => {
    let title = "";
    let message = "";
    let color = "#5d60ff"; // Default purple
    let icon = "🔔";

    switch (type) {
        case "WARNING":
            title = "Attention: Credit level is below 30%";
            message = `Your OpenRouter credits are running low. Current usage is ${totalUsage} out of ${totalCredit} (${remainingPercentage} remaining).`;
            color = "#f59e0b"; // Orange
            icon = "⚠️";
            break;
        case "CRITICAL":
            title = "Critical: Credit level is below 10%";
            message = `Your OpenRouter credits are extremely low! Please recharge immediately to avoid service interruption. Current usage is ${totalUsage} out of ${totalCredit} (${remainingPercentage} remaining).`;
            color = "#ef4444"; // Red
            icon = "🚨";
            break;
        case "INCIDENT":
            title = "Incident: Credits exhausted or insufficient";
            message = `Service has been interrupted because OpenRouter credits are exhausted or insufficient to process current requests.`;
            color = "#7f1d1d"; // Dark Red
            icon = "❌";
            break;
        case "RUNTIME_ERROR":
            title = "Runtime Error: OpenRouter API issue";
            message = `An unexpected runtime error because OpenRouter credits are exhausted or insufficient to process current requests. ${errorMessage}`;
            color = "#1f2937"; // Gray/Dark
            icon = "⚙️";
            break;
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
    <style type="text/css">
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Montserrat', sans-serif; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { padding: 40px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e5e7eb; }
        .content { padding: 40px; }
        .alert-box { padding: 24px; border-radius: 8px; border-left: 4px solid ${color}; background-color: ${color}10; margin-bottom: 24px; }
        .alert-title { font-size: 20px; font-weight: bold; color: ${color}; margin-bottom: 8px; display: flex; align-items: center; }
        .alert-message { font-size: 16px; color: #374151; line-height: 1.5; }
        .stats-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        .stats-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
        .stats-label { font-size: 14px; color: #6b7280; font-weight: 500; }
        .stats-value { font-size: 14px; color: #111827; font-weight: bold; text-align: right; }
        .footer { padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="${ENDPOINT_URL}/images/logos/klque-logo.PNG" alt="KLQUE" width="120" style="display: block; margin: 0 auto;">
        </div>
        <div class="content">
            <div class="alert-box">
                <div class="alert-title">${icon} ${title}</div>
                <div class="alert-message">${message}</div>
            </div>
            
            ${type !== "RUNTIME_ERROR" ? `
            <table class="stats-table">
                <tr>
                    <td class="stats-label">Total Credits</td>
                    <td class="stats-value">${totalCredit?.toFixed(2)}</td>
                </tr>
                <tr>
                    <td class="stats-label">Total Usage</td>
                    <td class="stats-value">${totalUsage?.toFixed(2)}</td>
                </tr>
                <tr>
                    <td class="stats-label">Remaining</td>
                    <td class="stats-value">${remainingPercentage}</td>
                </tr>
            </table>
            ` : ""}

            <div style="margin-top: 32px; text-align: center;">
                <a href="https://openrouter.ai/credits" style="display: inline-block; padding: 12px 24px; background-color: ${color}; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
                    Recharge Credits
                </a>
            </div>
        </div>
        <div class="footer">
            © ${new Date().getFullYear()} KLQUE. System Alert.<br>
            Please do not reply to this automated message.
        </div>
    </div>
</body>
</html>
`;
};
