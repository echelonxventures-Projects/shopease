/**
 * Centralized, env-driven application configuration.
 *
 * For self-hosting, the ONLY required domain setting is `NEXT_PUBLIC_APP_URL`
 * (e.g. https://shop.example.com). Brand/email values are derived from it but
 * can each be overridden via their own env var. Nothing here is hardcoded to a
 * specific deployment.
 */

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Commerce";

function hostFromUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "localhost";
  }
}

export const APP_HOST = hostFromUrl(APP_URL);

/** "From" header for transactional email. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM || `${APP_NAME} <noreply@${APP_HOST}>`;

/** Public support contact. */
export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || `support@${APP_HOST}`;

/** Billing/legal contacts used on invoices and policy pages. */
export const COMPANY_EMAIL = process.env.COMPANY_EMAIL || `billing@${APP_HOST}`;
export const COMPANY_WEBSITE = process.env.COMPANY_WEBSITE || APP_HOST;
