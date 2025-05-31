const resendTracker = new Map(); // email -> timestamp

/**
 * Check if an email is allowed to receive another message, based on cooldown.
 * @param {string} email - The target email address.
 * @param {number} cooldownMs - Time in ms between allowed sends (default: 60s).
 * @returns {boolean} - True if allowed, false if still cooling down.
 */
export function canResend(email, cooldownMs = 60_000) {
  if (!email) return false;

  const now = Date.now();
  const lastSent = resendTracker.get(email.toLowerCase());

  if (lastSent && now - lastSent < cooldownMs) {
    return false;
  }

  resendTracker.set(email.toLowerCase(), now);
  return true;
}
