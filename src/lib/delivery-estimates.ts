export interface DeliveryEstimate {
  earliestDate: Date;
  latestDate: Date;
  isFree: boolean;
  fee: number;
}

export function calculateDeliveryEstimate(
  shippingDaysMin: number = 2,
  shippingDaysMax: number = 5,
  orderTotal: number = 0,
  freeThreshold: number = 500,
  shippingRate: number = 40,
): DeliveryEstimate {
  const now = new Date();
  const days = shippingDaysMin + Math.floor(Math.random() * (shippingDaysMax - shippingDaysMin + 1));

  const earliest = new Date(now);
  earliest.setDate(earliest.getDate() + days);

  const latest = new Date(earliest);
  latest.setDate(latest.getDate() + 1);

  // Skip weekends
  while (earliest.getDay() === 0 || earliest.getDay() === 6) {
    earliest.setDate(earliest.getDate() + 1);
  }
  while (latest.getDay() === 0 || latest.getDay() === 6) {
    latest.setDate(latest.getDate() + 1);
  }

  const isFree = orderTotal >= freeThreshold;

  return {
    earliestDate: earliest,
    latestDate: latest,
    isFree,
    fee: isFree ? 0 : shippingRate,
  };
}

export function formatDeliveryDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-IN", options);
}
