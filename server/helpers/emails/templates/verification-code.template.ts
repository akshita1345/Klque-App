
export const VerificationCodeTemplate = ({ link, code, ENDPOINT_URL }: {
  link: string, code: number, ENDPOINT_URL:
  string
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - KLQUE</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style type="text/css">
        /* Reset styles */
        body, table, td, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        /* Client-specific styles */
        .ReadMsgBody { width: 100%; }
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {
            line-height: 100%;
        }

        /* Mobile styles */
        @media only screen and (max-width: 600px) {
            .mobile-center {
                text-align: center !important;
            }
            .mobile-padding {
                padding: 20px !important;
            }
            .mobile-font-size {
                font-size: 24px !important;
            }
            .mobile-button {
                width: 100% !important;
                display: block !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Montserrat, -apple-system, 'Segoe UI', sans-serif;">
    <!-- Main Container -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <!-- Email Content Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); max-width: 600px;">
                    
                    <!-- Header with Logo -->
                    <tr>
                        <td align="center" style="padding: 40px 40px 20px 40px;">
                            <img src="${ENDPOINT_URL}/images/logos/klque-logo.PNG" alt="KLQUE" width="150" height="auto" style="display: block; margin: 0 auto;">
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;" class="mobile-padding">
                            
                            <!-- Welcome Message -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding-bottom: 30px;">
                                        <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #1f2937; line-height: 1.3;" class="mobile-font-size">
                                            Verify Your Email Address
                                        </h1>
                                        <p style="margin: 15px 0 0 0; font-size: 16px; color: #6b7280; line-height: 1.5;">
                                            We're excited to have you on board! To complete your registration and secure your account, please verify your email address.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- OTP Section -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; border: 2px solid #e5e7eb;">
                                <tr>
                                    <td align="center" style="padding: 30px 20px;">
                                        <h2 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #374151;">
                                            Your Verification Code
                                        </h2>
                                        <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280;">
                                            Enter this 6-digit code in the verification screen:
                                        </p>
                                        
                                        <!-- OTP Code Display -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="background-color: #ffffff; border: 2px solid #5d60ff; border-radius: 8px; padding: 15px 25px;">
                                                    <span style="font-size: 32px; font-weight: bold; color: #1f2937; letter-spacing: 8px;">
                                                        ${code}
                                                    </span>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
                                            This code will expire in <strong>10 minutes</strong>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Divider -->
                            <!-- <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="border-top: 1px solid #e5e7eb; position: relative;">
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto; margin-top: -12px;">
                                                        <tr>
                                                            <td style="background-color: #ffffff; padding: 0 15px;">
                                                                <span style="font-size: 14px; color: #9ca3af; font-weight: 500;">OR</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table> -->

                            <!-- Magic Link Section -->
                            <!-- <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr> -->
                                    <!-- <td align="center">
                                        <h3 style="margin: 0 0 15px 0; font-size: 18px; font-weight: bold; color: #374151;">
                                            One-Click Verification
                                        </h3>
                                        <p style="margin: 0 0 25px 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                                            Skip the code entry! Click the button below to automatically verify your email and sign in to your account.
                                        </p> -->
                                        
                                        <!-- Magic Link Button -->
                                        <!-- <table role="presentation" cellspacing="0" cellpadding="0" border="0" class="mobile-button">
                                            <tr>
                                                <td align="center" style="border-radius: 8px; background-color: #5d60ff;">
                                                    <a href="${link}" 
                                                       style="display: inline-block; padding: 16px 32px; font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 8px; min-width: 200px; text-align: center;">
                                                        ✨ Verify Email Instantly
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                         -->
                                        <!-- <p style="margin: 20px 0 0 0; font-size: 12px; color: #9ca3af;">
                                            This link will expire in <strong>10 minutes</strong> for security reasons
                                        </p> -->
                                    <!-- </td>
                                </tr>
                            </table> -->

                            <!-- Security Notice -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 40px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #92400e;">
                                            🔒 Security Notice
                                        </h4>
                                        <p style="margin: 0; font-size: 13px; color: #92400e; line-height: 1.4;">
                                            • Never share this code with anyone<br>
                                            • KLQUE will never ask for your verification code<br>
                                            • If you didn't request this, please ignore this email
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;" class="mobile-padding">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <p style="margin: 0 0 15px 0; font-size: 14px; font-weight: bold; color: #374151;">
                                            Welcome to KLQUE!
                                        </p>
                                        <p style="margin: 0 0 20px 0; font-size: 13px; color: #6b7280; line-height: 1.4;">
                                            You're joining thousands of users who trust KLQUE for their daily needs. We're committed to providing you with the best experience possible.
                                        </p>
                                        
                                        <!-- Social Links -->
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                            <tr>
                                                <td style="padding: 0 10px;">
                                                    <a href="${ENDPOINT_URL}/privacy-policy" style="color: #6b7280; text-decoration: none; font-size: 12px;">Privacy Policy</a>
                                                </td>
                                                <td style="padding: 0 10px; color: #d1d5db;">|</td>
                                                <td style="padding: 0 10px;">
                                                    <a href="${ENDPOINT_URL}/terms-of-use" style="color: #6b7280; text-decoration: none; font-size: 12px;">Terms of Service</a>
                                                </td>
                                            </tr>
                                        </table>

                                        <p style="margin: 20px 0 0 0; font-size: 11px; color: #9ca3af;">
                                            © ${new Date().getFullYear()} KLQUE. All rights reserved.<br>
                                            This email was sent to you because you signed up for a KLQUE account.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`