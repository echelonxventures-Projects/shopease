export function formatCurrency(amount: number, symbol: string): string {
  return `${symbol}${Number(amount).toFixed(2)}`;
}
