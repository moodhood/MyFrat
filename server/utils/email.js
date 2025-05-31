// server/utils/email.js

import { Resend } from 'resend';
import { htmlToText } from 'html-to-text';
import {
  confirmationTemplate,
  resetPasswordTemplate
} from './emailTemplates.js';

// Ensure your Resend API key is set
const { RESEND_API_KEY } = process.env;
if (!RESEND_API_KEY) {
  throw new Error('❌ RESEND_API_KEY not defined in environment');
}

const resend = new Resend(RESEND_API_KEY);

// Use your verified domain sender
const SENDER = 'LambdaManager <onboarding@lambdamanager.com>';

/**
 * Low-level email sender via Resend API, with HTML + plain-text fallback.
 *
 * @param {string} recipient – Email address of the recipient.
 * @param {string} subject   – Subject line.
 * @param {string} html      – HTML body.
 * @returns {Promise<Object>} – Resend API response.
 */
const sendEmail = async (recipient, subject, html) => {
  if (!recipient || !subject || !html) {
    throw new Error('sendEmail requires recipient, subject, and html');
  }

  // Generate plain-text fallback
  const text = htmlToText(html, {
    wordwrap: false,
    selectors: [{ selector: 'a', options: { ignoreHref: false } }]
  });

  console.log(`📤 Sending "${subject}" to ${recipient}`);
  try {
    const response = await resend.emails.send({
      from:    SENDER,
      to:      recipient,
      subject,
      html,
      text    // ← plain-text alternative
    });
    console.log('✅ Email sent:', response);
    return response;
  } catch (err) {
    console.error('❌ Resend API error:', err);
    throw err;
  }
};

/**
 * Send a confirmation-code email.
 *
 * @param {string} recipient – Recipient email.
 * @param {string} code      – Six-digit confirmation code.
 * @returns {Promise<Object>}
 */
export const sendConfirmationEmail = (recipient, code) =>
  sendEmail(recipient, 'Confirm your email', confirmationTemplate(code));

/**
 * Send a password-reset email with CTA button.
 *
 * @param {string} recipient – Recipient email.
 * @param {string} link      – Password reset URL.
 * @returns {Promise<Object>}
 */
export const sendResetPasswordEmail = (recipient, link) =>
  sendEmail(recipient, 'Reset your password', resetPasswordTemplate(link));
