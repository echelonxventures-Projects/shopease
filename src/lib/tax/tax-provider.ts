/**
 * Tax Provider Interface & Registry
 *
 * Country-agnostic abstraction for fetching government-published tax rates
 * and calculating product-specific tax at checkout.
 *
 * Each country implements the TaxProvider interface with its own rules
 * (GST for India, Sales Tax for US, VAT for EU, etc.)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaxRateRule {
  country: string;
  state?: string;
  taxType: string;           // GST, CGST, SGST, IGST, VAT, SALES_TAX, CST
  hsCode?: string;           // optional HS code prefix (chapter level, e.g. "61" for clothing)
  taxCategory?: string;      // maps to TaxCategory enum (STANDARD, FOOD, BOOKS, etc.)
  rate: number;              // decimal (0.18 = 18%)
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  effectiveFrom: Date;
  source: string;            // e.g. "CBIC Notification 1/2017"
  description?: string;
}

export interface TaxResult {
  totalRate: number;         // combined rate (e.g. 0.18)
  breakdown: Array<{         // individual tax components
    type: string;            // CGST, SGST, IGST, VAT
    rate: number;
    description: string;
  }>;
  isInterState: boolean;     // true = IGST, false = CGST+SGST
  source: string;            // which notification/provider
}

export interface TaxProvider {
  readonly countryCode: string;
  readonly name: string;

  /** Fetch latest rates from government sources */
  fetchRates(): Promise<TaxRateRule[]>;

  /**
   * Calculate tax for a specific product
   * @param taxCategory - Product's tax category (STANDARD, FOOD, BOOKS, etc.)
   * @param hsCode - Product's HS code (if available)
   * @param state - Destination state/province
   * @returns TaxResult with breakdown
   */
  calculateTax(
    taxCategory: string,
    hsCode: string | null,
    state: string | null,
    isSameState: boolean,
  ): TaxResult;
}

// ─── Registry ────────────────────────────────────────────────────────────────

const providers = new Map<string, TaxProvider>();

export function registerProvider(provider: TaxProvider): void {
  providers.set(provider.countryCode, provider);
}

export function getProvider(countryCode: string): TaxProvider | undefined {
  return providers.get(countryCode.toUpperCase());
}

export function getAllProviders(): TaxProvider[] {
  return Array.from(providers.values());
}

// ─── Re-export helpers ───────────────────────────────────────────────────────

export { INDIA_GST_RATES } from "./data/india-gst-rates";
// Note: IndiaGSTProvider is auto-registered via side-effect import in tax-actions.ts
// Do NOT re-export it here — it would cause a circular dependency
