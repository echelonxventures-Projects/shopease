/**
 * CBIC-published GST rates for India
 * Source: Notification No. 1/2017, 2/2017, 3/2017, 4/2017 (CGST)
 * https://www.cbic-gst.gov.in/
 *
 * All rates in decimal form (0.05 = 5%).
 * For CGST/SGST: rate is split equally (e.g. 0.025 each = 5% total).
 *
 * RULE: Each (taxCategory, hsCodePrefix) must be unique.
 * Use hsCodePrefix: null for the category-wide default rate.
 */

export interface GSTRateEntry {
  taxCategory: string;
  hsCodePrefix: string | null;
  description: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  source: string;
}

export const INDIA_GST_RATES: GSTRateEntry[] = [
  // 5% — essential food (fresh produce, milk, eggs, flour, packaged food)
  {
    taxCategory: "FOOD",
    hsCodePrefix: null,
    description: "Essential food items, fresh produce, milk, eggs, flour, packaged food",
    cgstRate: 0.025, sgstRate: 0.025, igstRate: 0.05,
    source: "Notification 1/2017-CGST, Rate 5%",
  },

  // 18% — standard rate (electronics, appliances, pharmaceuticals, services)
  {
    taxCategory: "STANDARD",
    hsCodePrefix: null,
    description: "Standard rate — electronics, appliances, mobile phones, computers, services",
    cgstRate: 0.09, sgstRate: 0.09, igstRate: 0.18,
    source: "Notification 1/2017-CGST, Rate 18%",
  },
  {
    taxCategory: "PHARMA",
    hsCodePrefix: null,
    description: "Pharmaceutical products",
    cgstRate: 0.09, sgstRate: 0.09, igstRate: 0.18,
    source: "Notification 1/2017-CGST, Rate 18%",
  },

  // 5% — clothing ≤ ₹1000 (most common rate)
  {
    taxCategory: "CLOTHING",
    hsCodePrefix: null,
    description: "Clothing value ≤ ₹1000 (most common)",
    cgstRate: 0.025, sgstRate: 0.025, igstRate: 0.05,
    source: "Notification 1/2017-CGST, Rate 5% (value ≤ ₹1000)",
  },

  // 28% — luxury goods, tobacco
  {
    taxCategory: "LUXURY",
    hsCodePrefix: null,
    description: "Luxury goods — automobiles, motorcycles, ACs, TVs, perfumes",
    cgstRate: 0.14, sgstRate: 0.14, igstRate: 0.28,
    source: "Notification 1/2017-CGST, Rate 28%",
  },
  {
    taxCategory: "TOBACCO",
    hsCodePrefix: null,
    description: "Cigarettes, tobacco products (28% GST + additional cess)",
    cgstRate: 0.14, sgstRate: 0.14, igstRate: 0.28,
    source: "Notification 1/2017-CGST, Rate 28% + cess",
  },

  // 0% — nil-rated / exempt
  {
    taxCategory: "BOOKS",
    hsCodePrefix: null,
    description: "Books, journals, newspapers, educational materials",
    cgstRate: 0.0, sgstRate: 0.0, igstRate: 0.0,
    source: "Notification 1/2017-CGST, Schedule I (Nil-rated)",
  },
  {
    taxCategory: "ALCOHOL",
    hsCodePrefix: null,
    description: "Alcohol for human consumption — outside GST (state excise)",
    cgstRate: 0.0, sgstRate: 0.0, igstRate: 0.0,
    source: "Article 286 Constitution — alcohol excluded from GST",
  },
];
