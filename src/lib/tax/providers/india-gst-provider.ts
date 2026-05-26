import {
  TaxProvider,
  TaxRateRule,
  TaxResult,
  registerProvider,
} from "../tax-provider";
import { INDIA_GST_RATES } from "../data/india-gst-rates";

/**
 * India GST Provider — implements TaxProvider for CGST/SGST/IGST calculation
 * based on product tax category, HS code, and destination state.
 *
 * Intra-state (same state): CGST + SGST
 * Inter-state (different state): IGST
 */
export class IndiaGSTProvider implements TaxProvider {
  readonly countryCode = "IN";
  readonly name = "India GST (CBIC)";

  private rates: TaxRateRule[] | null = null;

  async fetchRates(): Promise<TaxRateRule[]> {
    if (this.rates) return this.rates;

    this.rates = INDIA_GST_RATES.map((entry) => ({
      country: "IN",
      taxType: this.determineTaxType(entry),
      hsCode: entry.hsCodePrefix ?? undefined,
      taxCategory: entry.taxCategory,
      rate: entry.igstRate,
      cgstRate: entry.cgstRate,
      sgstRate: entry.sgstRate,
      igstRate: entry.igstRate,
      effectiveFrom: new Date("2017-07-01"), // GST inception date
      source: entry.source,
      description: entry.description,
    }));

    return this.rates;
  }

  calculateTax(
    taxCategory: string,
    hsCode: string | null,
    _state: string | null,
    isSameState: boolean,
  ): TaxResult {
    const rules = this.rates ?? [];

    // Find the best-matching rule: prefer HS code prefix match, fall back to category-only
    const matched =
      rules.find((r) => {
        if (r.taxCategory !== taxCategory) return false;
        if (r.hsCode && hsCode) {
          return hsCode.startsWith(r.hsCode);
        }
        return !r.hsCode; // rule without HS prefix = category default
      }) ??
      rules.find(
        (r) => r.taxCategory === taxCategory && !r.hsCode,
      ) ??
      this.defaultRule(isSameState);

    if (isSameState) {
      return {
        totalRate: (matched.cgstRate ?? 0) + (matched.sgstRate ?? 0),
        breakdown: [
          {
            type: "CGST",
            rate: matched.cgstRate ?? 0,
            description: `Central GST — ${matched.source}`,
          },
          {
            type: "SGST",
            rate: matched.sgstRate ?? 0,
            description: `State GST — ${matched.source}`,
          },
        ],
        isInterState: false,
        source: matched.source,
      };
    } else {
      return {
        totalRate: matched.igstRate ?? 0,
        breakdown: [
          {
            type: "IGST",
            rate: matched.igstRate ?? 0,
            description: `Integrated GST — ${matched.source}`,
          },
        ],
        isInterState: true,
        source: matched.source,
      };
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private determineTaxType(entry: typeof INDIA_GST_RATES[number]): string {
    // We store IGST as the type for inter-state; CGST/SGST pairs for intra-state
    return "GST";
  }

  private defaultRule(isSameState: boolean): TaxRateRule {
    if (isSameState) {
      return {
        country: "IN",
        taxType: "GST",
        rate: 0.09,
        cgstRate: 0.09,
        sgstRate: 0.09,
        igstRate: 0.18,
        effectiveFrom: new Date("2017-07-01"),
        source: "Default fallback (18% GST)",
      };
    } else {
      return {
        country: "IN",
        taxType: "GST",
        rate: 0.18,
        cgstRate: 0.09,
        sgstRate: 0.09,
        igstRate: 0.18,
        effectiveFrom: new Date("2017-07-01"),
        source: "Default fallback (18% GST)",
      };
    }
  }
}

// Auto-register on import
const provider = new IndiaGSTProvider();
registerProvider(provider);
export { provider as indiaGSTProvider };
