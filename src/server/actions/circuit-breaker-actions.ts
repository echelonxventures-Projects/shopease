"use server";

import { getSession, isAdminRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { circuitBreakerRegistry } from "@/lib/circuit-breaker";
import type { CircuitBreakerSnapshot } from "@/lib/circuit-breaker/types";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

/**
 * Get the current state of all circuit breakers.
 */
export const getCircuitBreakerStates = withErrorHandling(async (): Promise<{
  breakers: CircuitBreakerSnapshot[];
}> => {
  await requireAdmin();
  const breakers = circuitBreakerRegistry.getAllSnapshots();
  return { breakers };
});

/**
 * Reset a specific circuit breaker by name.
 */
export const resetCircuitBreaker = withErrorHandling(
  async (input: { name: string }): Promise<{ success: boolean; name: string }> => {
    await requireAdmin();
    const found = circuitBreakerRegistry.reset(input.name);
    if (!found) {
      throw new Error(`Circuit breaker "${input.name}" not found`);
    }
    return { success: true, name: input.name };
  }
);

/**
 * Reset all circuit breakers.
 */
export const resetAllBreakers = withErrorHandling(async (): Promise<{
  success: boolean;
  count: number;
}> => {
  await requireAdmin();
  const count = circuitBreakerRegistry.getAll().length;
  circuitBreakerRegistry.resetAll();
  return { success: true, count };
});
