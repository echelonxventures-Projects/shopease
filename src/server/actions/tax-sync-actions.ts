"use server";

import { prisma } from "@/lib/prisma";
import { getAllProviders, getProvider, TaxProvider } from "@/lib/tax/tax-provider";
import "@/lib/tax/providers/india-gst-provider"; // auto-registers India GST provider

/**
 * Sync tax rates from all (or a specific) country provider into the StateTaxRule table.
 * Upserts rules based on the provider's fetched rates and logs the sync to TaxSyncLog.
 */
export async function syncTaxRates(countryCode?: string) {
  const providers = countryCode
    ? [getProvider(countryCode)].filter((p): p is TaxProvider => !!p)
    : getAllProviders();

  if (providers.length === 0) {
    throw new Error(
      countryCode
        ? `No provider found for country: ${countryCode}`
        : "No tax providers registered"
    );
  }

  const results: Array<{
    countryCode: string;
    providerName: string;
    rulesCount: number;
    status: string;
    error?: string;
  }> = [];

  for (const provider of providers) {
    const log = await prisma.taxSyncLog.create({
      data: {
        countryCode: provider.countryCode,
        source: provider.name,
        rulesCount: 0,
        status: "PENDING",
      },
    });

    try {
      const rates = await provider.fetchRates();

      // Upsert each rate into StateTaxRule
      for (const rate of rates) {
        await prisma.stateTaxRule.upsert({
          where: {
            country_state_taxType_effectiveFrom: {
              country: rate.country,
              taxType: rate.taxType,
              effectiveFrom: rate.effectiveFrom,
              state: rate.state ?? "",
            },
          },
          create: {
            country: rate.country,
            state: rate.state ?? null,
            taxType: rate.taxType,
            cgstRate: rate.cgstRate ?? undefined,
            sgstRate: rate.sgstRate ?? undefined,
            igstRate: rate.igstRate ?? undefined,
            totalRate: rate.rate,
            effectiveFrom: rate.effectiveFrom,
            notes: rate.description ?? rate.source,
          },
          update: {
            cgstRate: rate.cgstRate ?? undefined,
            sgstRate: rate.sgstRate ?? undefined,
            igstRate: rate.igstRate ?? undefined,
            totalRate: rate.rate,
            notes: rate.description ?? rate.source,
          },
        });
      }

      // Also populate TaxCategoryRule — one representative rate per category
      const region = await prisma.region.findUnique({
        where: { code: provider.countryCode },
      });

      if (region) {
        // Collect unique taxCategories, pick the default rate (no hsCode) for each
        const categoryMap = new Map<string, { rate: number; source: string }>();
        for (const rate of rates) {
          if (!rate.taxCategory) continue;
          const existing = categoryMap.get(rate.taxCategory);
          // Prefer entries without hsCode (category default); otherwise keep existing
          if (!rate.hsCode) {
            categoryMap.set(rate.taxCategory, { rate: rate.igstRate ?? rate.rate, source: rate.source });
          } else if (!existing) {
            categoryMap.set(rate.taxCategory, { rate: rate.igstRate ?? rate.rate, source: rate.source });
          }
        }

        let _categoryRulesCount = 0;
        for (const [taxCategory, { rate, source }] of categoryMap) {
          await prisma.taxCategoryRule.upsert({
            where: {
              taxCategory_regionId: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
                taxCategory: taxCategory as any,
                regionId: region.id,
              },
            },
            create: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
              taxCategory: taxCategory as any,
              regionId: region.id,
              taxRate: rate,
              description: source,
              isActive: rate > 0,
            },
            update: {
              taxRate: rate,
              description: source,
              isActive: rate > 0,
            },
          });
          _categoryRulesCount++;
        }
      }

      await prisma.taxSyncLog.update({
        where: { id: log.id },
        data: {
          status: "SUCCESS",
          rulesCount: rates.length,
        },
      });

      results.push({
        countryCode: provider.countryCode,
        providerName: provider.name,
        rulesCount: rates.length,
        status: "SUCCESS",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      await prisma.taxSyncLog.update({
        where: { id: log.id },
        data: {
          status: "FAILED",
          error: errorMsg,
        },
      });

      results.push({
        countryCode: provider.countryCode,
        providerName: provider.name,
        rulesCount: 0,
        status: "FAILED",
        error: errorMsg,
      });
    }
  }

  return { success: true, results };
}

/**
 * Get the most recent sync log entries per country.
 */
export async function getTaxSyncStatus() {
  const logs = await prisma.taxSyncLog.groupBy({
    by: ["countryCode"],
    _max: { syncedAt: true },
    _count: true,
  });

  const details = await Promise.all(
    logs.map(async (entry) => {
      const lastLog = await prisma.taxSyncLog.findFirst({
        where: { countryCode: entry.countryCode },
        orderBy: { syncedAt: "desc" },
        take: 1,
      });

      return {
        countryCode: entry.countryCode,
        lastSyncAt: lastLog?.syncedAt,
        lastStatus: lastLog?.status,
        lastSource: lastLog?.source,
        rulesCount: lastLog?.rulesCount,
        totalSyncs: entry._count,
      };
    })
  );

  return details;
}

/**
 * Get the list of all registered tax providers.
 */
export async function getAvailableProviders() {
  const providers = getAllProviders();
  return providers.map((p) => ({
    countryCode: p.countryCode,
    name: p.name,
  }));
}
