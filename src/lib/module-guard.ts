/**
 * Module Guard Middleware
 * 
 * Usage in any server action:
 *   import { withModuleGuard } from "@/lib/module-guard";
 *   export const myAction = withModuleGuard("payments", async (params) => { ... });
 * 
 * Super Admin bypasses all guards.
 * Site Admin must have the module granted by Super Admin.
 */

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function checkModuleAccess(moduleId: string): Promise<boolean> {
  const session = await getSession();
  if (!session?.user) return false;

  const role = (session.user as { role?: string }).role;
  if (role === "SUPER_ADMIN") return true;

  const siteId = (session.user as { siteId?: string }).siteId;
  if (!siteId) return role === "ADMIN"; // Global admin has all

  const row = await prisma.systemConfig.findUnique({ where: { key: `site_modules.${siteId}` } });
  if (!row) return false;

  const grants: Record<string, boolean> = JSON.parse(row.value);
  return grants[moduleId] === true;
}

export function withModuleGuard<T extends unknown[], R>(moduleId: string, fn: (...args: T) => Promise<R>) {
  return async (...args: T): Promise<R> => {
    const allowed = await checkModuleAccess(moduleId);
    if (!allowed) throw new Error(`Access denied: "${moduleId}" module not enabled for your site`);
    return fn(...args);
  };
}
