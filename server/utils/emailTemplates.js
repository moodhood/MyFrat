// server/utils/emailTemplates.js

const BRAND_NAME = 'LambdaManager';
const BRAND_DOMAIN = 'https://LambdaManager.com';
const LOGO_URL = `${BRAND_DOMAIN}/assets/logo.png`; // adjust path as needed

/**
 * Basic responsive wrapper
 */
function wrapInLayout(innerHtml) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${BRAND_NAME}</title>
  </head>
  <body style="margin:0;padding:0;font-family:Arial,sans-serif; background-color:#f4f4f4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:20px 0">
          <img src="${LOGO_URL}" alt="${BRAND_NAME} Logo" width="120" style="display:block;" />
        </td>
      </tr>
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="padding:30px;">
                ${innerHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px; text-align:center; font-size:12px; color:#888;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br/>
                <a href="${BRAND_DOMAIN}" style="color:#888; text-decoration:none;">Visit our site</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Confirmation code email
 */
export function confirmationTemplate(code) {
  const inner = `
    <h1 style="margin:0 0 16px; color:#333;">Confirm your email</h1>
    <p style="margin:0 0 24px; color:#555;">
      Welcome to ${BRAND_NAME}! Please use the code below to verify your email address.
    </p>
    <div style="
      display:inline-block;
      padding:12px 24px;
      font-size:24px;
      font-weight:bold;
      color:#ffffff;
      background-color:#1a73e8;
      border-radius:4px;
      text-decoration:none;
      margin-bottom:24px;
    ">
      ${code}
    </div>
    <p style="margin:24px 0 0; color:#555;">
      If you didn't sign up, just ignore this email.
    </p>
  `;
  return wrapInLayout(inner);
}

/**
 * Password reset email with a call-to-action button
 */
export function resetPasswordTemplate(link) {
  const inner = `
    <h1 style="margin:0 0 16px; color:#333;">Reset your password</h1>
    <p style="margin:0 0 24px; color:#555;">
      We received a request to reset your password for your ${BRAND_NAME} account.
    </p>
    <a href="${link}" style="
      display:inline-block;
      padding:12px 24px;
      font-size:16px;
      color:#ffffff;
      background-color:#d93025;
      border-radius:4px;
      text-decoration:none;
      margin-bottom:24px;
    ">
      Reset Password
    </a>
    <p style="margin:24px 0 0; color:#555;">
      If you didn’t request this, you can safely ignore this email.
    </p>
  `;
  return wrapInLayout(inner);
}
