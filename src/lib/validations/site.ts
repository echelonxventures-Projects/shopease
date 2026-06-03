import { z } from "zod";

// ── Reusable primitives ────────────────────────────────────────────────────

/** kebab-case ASCII; 2–60 chars; used for slugs, subdomains, category presets */
const kebabSlug = z
  .string()
  .trim()
  .min(2, "Must be at least 2 characters")
  .max(60, "Must be at most 60 characters")
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, "Use lowercase letters, digits, and hyphens only");

/** ISO 4217 currency code (3 uppercase letters) */
const currencyCode = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/, "Currency must be a 3-letter ISO 4217 code")
  .optional();

/** BCP 47 locale (e.g. "en", "en-IN", "zh-Hant") — short reasonable bound */
const localeCode = z
  .string()
  .trim()
  .regex(
    /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/,
    "Locale must be a BCP 47 code (e.g. en, en-IN)",
  );

/** Hex color #RGB or #RRGGBB */
const hexColor = z
  .string()
  .trim()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex color (#RRGGBB)");

/** Bare hostname OR FQDN. No protocol, no path. */
const hostname = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
    "Must be a valid hostname",
  );

/** http(s) URL — used for logos, favicons. Bound to 2KB. */
const httpUrl = z
  .string()
  .trim()
  .max(2048, "URL too long")
  .regex(/^https?:\/\//, "Must start with http:// or https://");

/** International phone number (E.164-ish, lenient). */
const phone = z
  .string()
  .trim()
  .max(32, "Phone number too long")
  .regex(/^[+0-9()\-\s.]{6,32}$/, "Invalid phone number");

// ── Create / Update payloads ───────────────────────────────────────────────

export const createSiteSchema = z.object({
  // Identity
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: kebabSlug,
  domain: hostname.optional().or(z.literal("").transform(() => undefined)),
  subdomain: kebabSlug.optional().or(z.literal("").transform(() => undefined)),
  description: z.string().trim().max(500).optional(),

  // Branding
  logo: httpUrl.optional().or(z.literal("").transform(() => undefined)),
  favicon: httpUrl.optional().or(z.literal("").transform(() => undefined)),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  fontFamily: z.string().trim().max(60).optional(),

  // Region & locale
  regionId: z.string().cuid("Invalid region").optional()
    .or(z.literal("").transform(() => undefined)),
  defaultCurrency: currencyCode,
  defaultLocale: localeCode.optional()
    .or(z.literal("").transform(() => undefined)),
  supportedLocales: z.array(localeCode).max(50).optional(),

  // Contact
  contactEmail: z.string().trim().email("Invalid email").max(255).optional()
    .or(z.literal("").transform(() => undefined)),
  contactPhone: phone.optional()
    .or(z.literal("").transform(() => undefined)),
  contactAddress: z.string().trim().max(500).optional(),

  // Catalog seeding
  categoryIds: z.array(z.string().cuid()).max(500).optional(),
  brandIds: z.array(z.string().cuid()).max(500).optional(),

  // SEO
  metaTitle: z.string().trim().max(120).optional(),
  metaDescription: z.string().trim().max(300).optional(),

  // Free-form site flags (taxInclusive, timezone, maintenanceMode, etc.)
  settings: z.record(z.string(), z.unknown()).optional(),

  // Site admin credentials (created on site creation)
  adminEmail: z.string().trim().email("Invalid admin email").max(255).optional()
    .or(z.literal("").transform(() => undefined)),
  adminPassword: z.string().min(8, "Password must be at least 8 characters").max(128)
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[a-z]/, "Password must contain a lowercase letter")
    .regex(/[0-9]/, "Password must contain a number")
    .regex(/[^A-Za-z0-9]/, "Password must contain a special character")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;

// Update is a partial of create plus a few admin-only flags.
export const updateSiteSchema = createSiteSchema
  .partial()
  .extend({
    status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
    isDefault: z.boolean().optional(),
    theme: z.unknown().optional(),
  });

export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
