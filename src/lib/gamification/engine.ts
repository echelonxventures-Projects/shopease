// ===================== GAMIFICATION ENGINE =====================

export interface SpinSegment {
  label: string;
  type: "DISCOUNT" | "WALLET" | "FREE_PRODUCT" | "POINTS" | "TRY_AGAIN";
  value: number;
  probability: number; // 0-1, all must sum to 1
  color: string;
}

export interface SpinResult {
  segment: SpinSegment;
  rewardId?: string;
  newBalance?: number;
}

export interface ScratchCard {
  id: string;
  prizes: Array<{ label: string; type: string; value: number; revealed: boolean }>;
  maxReveals: number;
}

/**
 * Weighted random selection from spin wheel segments.
 * Probabilities must sum to 1 (validated at call-site).
 */
export function spinWheel(segments: SpinSegment[]): SpinSegment {
  if (segments.length === 0) {
    throw new Error("Spin wheel must have at least one segment");
  }

  const totalProbability = segments.reduce((sum, s) => sum + s.probability, 0);
  if (Math.abs(totalProbability - 1) > 0.01) {
    throw new Error(`Segment probabilities must sum to 1, got ${totalProbability}`);
  }

  let random = Math.random();
  for (const segment of segments) {
    random -= segment.probability;
    if (random <= 0) {
      return segment;
    }
  }

  // Fallback to last segment (floating point edge case)
  return segments[segments.length - 1];
}

/**
 * Generate a scratch card with hidden prizes.
 * @param prizes   Array of prize definitions
 * @param count    Total number of scratch cells (prizes are randomly placed)
 */
export function generateScratchCard(
  prizes: Array<{ label: string; type: string; value: number }>,
  count: number
): ScratchCard {
  if (prizes.length === 0) {
    throw new Error("At least one prize is required");
  }
  if (count < prizes.length) {
    throw new Error("Cell count must be >= prize count");
  }

  // Build cells: fill with prizes, then pad with TRY_AGAIN
  const cells: Array<{ label: string; type: string; value: number; revealed: boolean }> = [];

  for (const prize of prizes) {
    cells.push({ ...prize, revealed: false });
  }

  while (cells.length < count) {
    cells.push({ label: "Try Again", type: "TRY_AGAIN", value: 0, revealed: false });
  }

  // Fisher-Yates shuffle
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return {
    id,
    prizes: cells,
    maxReveals: Math.min(Math.ceil(count / 2), prizes.length + 2),
  };
}

/**
 * Escalating daily login reward based on streak length.
 * Base reward doubles every 3 days, capped at 500.
 * Day 1: 10, Day 2: 10, Day 3: 20, Day 4: 20, Day 5: 20, Day 6: 40, ...
 */
export function calculateDailyLoginReward(streak: number): number {
  if (streak <= 0) return 0;

  const base = 10;
  const tier = Math.floor((streak - 1) / 3);
  const reward = base * Math.pow(2, tier);

  // Cap at 500 points
  return Math.min(reward, 500);
}
