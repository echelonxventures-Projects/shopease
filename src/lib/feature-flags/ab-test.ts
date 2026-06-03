/**
 * A/B Testing framework with consistent hashing.
 * Users are deterministically assigned to variants based on test ID + user ID hash.
 * This ensures the same user always sees the same variant.
 */

export interface ABVariant {
  key: string;
  weight: number;
  config?: Record<string, unknown>;
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABVariant[];
  startDate: string;
  endDate?: string;
  trafficAllocation: number;
  status: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
  description?: string;
}

export interface ABTestResult {
  testId: string;
  variantKey: string;
  variantConfig?: Record<string, unknown>;
  isInTest: boolean;
}

/**
 * Consistent hash for deterministic variant assignment.
 */
function consistentHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Assign a user to a variant for a given test.
 */
export function assignVariant(testId: string, userId: string, variants: ABVariant[]): string {
  if (!variants.length) return "";

  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const hash = consistentHash(`${testId}:${userId}`);
  const bucket = hash % totalWeight;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.key;
    }
  }

  return variants[variants.length - 1].key;
}

/**
 * Check if a user is included in the test's traffic allocation.
 */
export function isInTraffic(testId: string, userId: string, trafficAllocation: number): boolean {
  if (trafficAllocation >= 100) return true;
  const hash = consistentHash(`traffic:${testId}:${userId}`);
  return (hash % 100) < trafficAllocation;
}

/**
 * Evaluate a full A/B test for a user.
 */
export function evaluateABTest(test: ABTest, userId: string): ABTestResult {
  // Check test status
  if (test.status !== "RUNNING") {
    return { testId: test.id, variantKey: "", isInTest: false };
  }

  // Check date range
  const now = new Date();
  if (new Date(test.startDate) > now) {
    return { testId: test.id, variantKey: "", isInTest: false };
  }
  if (test.endDate && new Date(test.endDate) < now) {
    return { testId: test.id, variantKey: "", isInTest: false };
  }

  // Check traffic allocation
  if (!isInTraffic(test.id, userId, test.trafficAllocation)) {
    return { testId: test.id, variantKey: "", isInTest: false };
  }

  // Assign variant
  const variantKey = assignVariant(test.id, userId, test.variants);
  const variant = test.variants.find((v) => v.key === variantKey);

  return {
    testId: test.id,
    variantKey,
    variantConfig: variant?.config,
    isInTest: true,
  };
}
