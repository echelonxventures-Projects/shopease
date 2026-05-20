"use server";

// Free currency conversion using exchangerate.host (no API key required)
// Free tier: unlimited requests for common currency pairs

const API_BASE = "https://api.exchangerate.host";

export async function convertCurrency(amount: number, from: string, to: string): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/latest?base=${from}&symbols=${to}`);
    const data = await res.json();

    if (!data.success && data.success !== undefined) throw new Error(data.error?.info || "Conversion failed");

    const rate = data.rates?.[to];
    if (!rate) throw new Error(`Rate not found for ${to}`);

    return Math.round(amount * rate * 100) / 100;
  } catch {
    // Fallback: return original amount
    return amount;
  }
}

export async function listCurrencies(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/list`);
    const data = await res.json();
    const currencies: Record<string, string> = {};

    if (data.success) {
      Object.entries(data.currencies as Record<string, any>).forEach(([code, info]) => {
        currencies[code] = (info as any).description || code;
      });
    }

    return currencies;
  } catch {
    return {
      INR: "Indian Rupee",
      USD: "US Dollar",
      EUR: "Euro",
      GBP: "British Pound",
      JPY: "Japanese Yen",
    };
  }
}

export async function getHistoricalRates(date: string, base: string = "USD"): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${API_BASE}/${date}?base=${base}`);
    const data = await res.json();

    if (!data.success) return {};
    return data.rates || {};
  } catch {
    return {};
  }
}
