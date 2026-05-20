const SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  AED: "د.إ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

export function getCurrencySymbol(currency: string): string {
  return SYMBOLS[currency] || `${currency} `;
}

export function formatPrice(amount: number, currency: string = "INR"): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${amount.toLocaleString("en-IN")}`;
}

export function convertPrice(amount: number, _fromCurrency: string, _toCurrency: string, rate: number = 1): number {
  // Placeholder — integrate with a real exchange rate API later
  return Math.round(amount * rate);
}
