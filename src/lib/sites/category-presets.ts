// Catalog presets for the Create Site flow. Each preset describes a
// curated bundle of categories that get auto-attached to the new site.
//
// Adding a preset: append to CATEGORY_PRESETS. Categories are resolved by
// slug at create-time, so unknown slugs are silently ignored — making this
// safe to ship before the catalog has all categories seeded.

export interface CategoryPreset {
  /** Stable identifier persisted in form state. */
  id: string;
  /** Human-readable label shown in the dropdown. */
  label: string;
  /** Short description shown under the option. */
  description: string;
  /**
   * Slugs of categories to auto-attach when this preset is chosen. An empty
   * list combined with `id === "GLOBAL"` is interpreted as "all top-level
   * categories"; an empty list with `id === "MIX"` means "let the admin pick".
   */
  categorySlugs: string[];
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: "GLOBAL",
    label: "Global / All Categories",
    description:
      "All top-level categories. Best for general-purpose marketplaces.",
    categorySlugs: [],
  },
  {
    id: "ELECTRONICS",
    label: "Electronics & Gadgets",
    description: "Phones, laptops, audio, cameras, smart devices.",
    categorySlugs: [
      "electronics",
      "mobiles",
      "laptops",
      "computers",
      "cameras",
      "audio",
      "tvs",
      "smartwatches",
      "accessories",
    ],
  },
  {
    id: "FASHION",
    label: "Fashion & Apparel",
    description: "Clothing, footwear, jewelry, accessories.",
    categorySlugs: [
      "fashion",
      "clothing",
      "shoes",
      "footwear",
      "accessories",
      "watches",
      "jewelry",
      "bags",
    ],
  },
  {
    id: "GROCERIES",
    label: "Groceries & Daily Needs",
    description: "Food, beverages, household supplies, personal care.",
    categorySlugs: [
      "groceries",
      "food",
      "beverages",
      "household",
      "personal-care",
      "snacks",
    ],
  },
  {
    id: "HOME",
    label: "Home & Living",
    description: "Furniture, decor, kitchen, garden.",
    categorySlugs: [
      "home",
      "furniture",
      "kitchen",
      "decor",
      "garden",
      "appliances",
    ],
  },
  {
    id: "BEAUTY",
    label: "Beauty & Wellness",
    description: "Cosmetics, skincare, health, fitness.",
    categorySlugs: [
      "beauty",
      "cosmetics",
      "skincare",
      "health",
      "wellness",
      "fitness",
    ],
  },
  {
    id: "MIX",
    label: "Custom (pick categories manually)",
    description: "Skip presets and choose categories one-by-one.",
    categorySlugs: [],
  },
];
