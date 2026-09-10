export const ResetPasswordTemplate = ({ userName, link, ENDPOINT_URL }: { userName: string, link: string, ENDPOINT_URL: string }) => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta charset="utf-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="only" />
  <meta name="supported-color-schemes" content="only" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <title>Reset Password</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <style>
    .hover-underline:hover {
      text-decoration: underline !important;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes ping {

      75%,
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    @keyframes pulse {
      50% {
        opacity: 0.5;
      }
    }

    @keyframes bounce {

      0%,
      100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
      }

      50% {
        transform: none;
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
      }
    }

    @media (max-width: 600px) {
      .sm-px-24 {
        padding-left: 24px !important;
        padding-right: 24px !important;
      }

      .sm-py-32 {
        padding-top: 32px !important;
        padding-bottom: 32px !important;
      }

      .sm-w-full {
        width: 100% !important;
      }
    }
  </style>
</head>

<body
  style="margin: 0; padding: 0; width: 100%; word-break: break-word; -webkit-font-smoothing: antialiased; background-color: #eceff1; font-family: Montserrat, -apple-system, 'Segoe UI', sans-serif !important;">
  <div style="display: none">A request to reset password was received from your KLQUE Account</div>
  <div role="article" aria-roledescription="email" aria-label="Reset your Password" lang="en">
    <table style="width: 100%" width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="background-color: #eceff1;">
          <table class="sm-w-full" style="width: 600px" width="600" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td class="sm-py-32 sm-px-24" style="padding: 48px; text-align: center;" align="center">
              </td>
            </tr>
            <tr>
              <td align="center" class="sm-px-24">
                <table style="width: 100%" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="sm-px-24"
                      style="background-color: #ffffff; border-radius: 4px; font-size: 14px; line-height: 24px; padding: 48px; text-align: left; color: #626262; padding-top: 26px; padding-bottom: 26px;"
                      align="left">
                      <p>
                        <a href="${ENDPOINT_URL}">
                          <img src="${ENDPOINT_URL}/images/logos/klque-logo.PNG" width="150" alt="KLQUE"
                            style="border: 0; max-width: 100%; line-height: 100%; vertical-align: middle; display: flex; margin: auto;" />
                        </a>
                      </p>
                      <p style="font-weight: 600; font-size: 18px; margin-bottom: 0;color: #6D6D6D;">Hello,</p>
                      <p style="font-weight: 700; font-size: 24px; margin-top: 0; color: black;">${userName}</p>
                      <p style="margin: 0 0 24px; font-size: 15px;color: #6D6D6D;">A request to reset password was
                        received from your <span style="font-weight: 600; color: black;">KLQUE account.</span>
                      <p style="margin: 0 0 24px;font-size: 15px;">Use this link to reset your password and login.</p>
                      <table cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="background-color: #5d60ff; border-radius: 4px;">
                            <a href="${link}"
                              style="display: block; font-weight: 600; font-size: 14px; line-height: 100%; padding: 16px 24px; color: #ffffff; text-decoration: none;">Reset
                              Password &rarr;</a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 24px 0;font-size: 15px;"><span
                          style="font-weight: 600; color: black;">Note:</span> This link is
                        valid for 1 hour from when it was sent to you and can be used to change your password only once.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="height: 20px" height="20"></td>
                  </tr>
                  <tr>
                    <td style="font-size: 12px; padding-left: 20px; padding-right: 20px; color: #eceff1;"></td>
                  </tr>
                  <tr>
                    <td style="height: 16px" height="16"></td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
</body>

</html>
`;