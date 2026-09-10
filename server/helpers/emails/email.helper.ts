import nodemailer from "nodemailer"
import { emailTemplates } from "./templates/index";

const { ENDPOINT_URL, EMAIL_USER, EMAIL_PASS } = process.env;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

export const randomStringGenerator = () => {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 10; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

export const emailNotification = async (userData: any, notifyType: string) => {
    try {
        const linkExpirationCode = await randomStringGenerator();

        const { _id, email, link, code, name } = userData;
        if (email) {
            const mailOptions: any = {
                from: `KLQUE<${EMAIL_USER}>`,
                to: email,
            };

            if (notifyType === "email-verification") {
                mailOptions["subject"] = "Email Verification";
                mailOptions["html"] = emailTemplates.verificationCode({
                    link,
                    code,
                    ENDPOINT_URL: ENDPOINT_URL || ""
                });

            }

            if (notifyType === "forgotPassword") {
                mailOptions["subject"] = "Reset Password";
                mailOptions["html"] = emailTemplates.resetPassword({
                    link: `${ENDPOINT_URL}/reset-password?_id=${_id}&code=${linkExpirationCode}`,
                    userName: name,
                    ENDPOINT_URL: ENDPOINT_URL || ""
                });

            }

            if (notifyType === "plan-subscribed") {
                mailOptions["subject"] = "Subscribed";
                mailOptions["html"] = emailTemplates.welcomeTrialTemplate({
                    userName: name,
                    ENDPOINT_URL: ENDPOINT_URL || ""
                });

            }

            if (mailOptions["subject"] && mailOptions["html"]) {
                const nodeMailerRes = await transporter.sendMail(mailOptions);
                if (nodeMailerRes) {
                    return {
                        flag: true,
                        data: linkExpirationCode,
                        message: nodeMailerRes.response,
                    };
                }
            }
            return { flag: false };
        }
        else {
            return { flag: false };
        }

    } catch (error: any) {
        console.log('Failed to send Email:', error.message);
        return { flag: false };
    }
}