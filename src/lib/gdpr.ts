// EU + EEA country codes (28 EU + 3 EEA = 31)
const EU_EEA_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO',
]);

export function isGdprRegion(regionCode: string | null | undefined): boolean {
  if (!regionCode) return false;
  return EU_EEA_COUNTRIES.has(regionCode.toUpperCase());
}

export const EU_EEA_LIST = Array.from(EU_EEA_COUNTRIES);
