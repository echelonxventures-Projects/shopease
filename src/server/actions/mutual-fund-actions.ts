"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { fintechProvider } from "@/lib/providers/fintech-providers";

interface FundSummary { id: string; name: string; category: string; nav: number; risk: string }
interface FundDetail extends FundSummary { returns1y: number; returns3y: number }

function requireUser(session: Awaited<ReturnType<typeof getSession>>): string {
  if (!session?.user) throw new Error("Unauthorized");
  return (session.user as { id: string }).id;
}

/** Live MF search via configured provider (mfapi.in by default). */
export async function searchFunds(query?: string, category?: string): Promise<FundSummary[]> {
  const provider = fintechProvider("mf");
  if (!provider || !query) return [];
  try {
    const funds = (await provider.execute("search", { query })) as FundSummary[];
    return category ? funds.filter((f) => f.category === category) : funds;
  } catch {
    return [];
  }
}

/** Fund detail with computed 1y/3y returns from real NAV history. */
export async function getFundDetail(schemeCode: string): Promise<FundDetail | null> {
  const provider = fintechProvider("mf");
  if (!provider) return null;
  try {
    return (await provider.execute("detail", { schemeCode })) as FundDetail;
  } catch {
    return null;
  }
}

async function liveNav(fundId: string): Promise<{ nav: number; name: string }> {
  const provider = fintechProvider("mf");
  if (!provider) throw new Error("MF provider unavailable");
  const { nav, name } = (await provider.execute("nav", { schemeCode: fundId })) as { nav: number; name: string };
  if (!nav) throw new Error("Live NAV unavailable for this fund");
  return { nav, name };
}

async function debitWallet(userId: string, amount: number, description: string, referenceId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient wallet balance");
  const before = Number(wallet.balance);
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description, referenceId, balanceBefore: before, balanceAfter: before - amount },
  });
}

export async function investLumpsum(fundId: string, amount: number) {
  const userId = requireUser(await getSession());
  const { nav, name } = await liveNav(fundId);
  await debitWallet(userId, amount, `MF lumpsum: ${name}`, `mf_${Date.now()}`);
  const units = amount / nav;
  const inv = await prisma.mutualFundInvestment.create({
    data: { userId, fundId, fundName: name, amount, units, nav, type: "LUMPSUM" },
  });
  return { investmentId: inv.id, fundId, amount, units: Number(units.toFixed(4)), nav, status: inv.status };
}

export async function setupSIP(fundId: string, amount: number, frequency: "MONTHLY" | "WEEKLY", startDate: string) {
  const userId = requireUser(await getSession());
  const { nav, name } = await liveNav(fundId);
  // first installment debited now; recurring debits handled by the scheduler/queue
  await debitWallet(userId, amount, `MF SIP (${frequency}): ${name}`, `sip_${Date.now()}`);
  const units = amount / nav;
  const inv = await prisma.mutualFundInvestment.create({
    data: { userId, fundId, fundName: name, amount, units, nav, type: "SIP" },
  });
  return { sipId: inv.id, fundId, amount, frequency, startDate, nav, status: inv.status };
}

export async function getPortfolio() {
  const session = await getSession();
  if (!session?.user) return { investments: [], totalValue: 0, totalInvested: 0, returns: 0, returnsPct: 0 };
  const userId = (session.user as { id: string }).id;

  const invs = await prisma.mutualFundInvestment.findMany({ where: { userId, status: "ACTIVE" } });
  // resolve current NAV once per distinct fund
  const navCache = new Map<string, number>();
  for (const fundId of new Set(invs.map((i) => i.fundId))) {
    try {
      navCache.set(fundId, (await liveNav(fundId)).nav);
    } catch {
      navCache.set(fundId, 0);
    }
  }

  let totalInvested = 0;
  let totalValue = 0;
  const investments = invs.map((i) => {
    const currentNav = navCache.get(i.fundId) || i.nav;
    const currentValue = i.units * currentNav;
    totalInvested += i.amount;
    totalValue += currentValue;
    return {
      id: i.id,
      fundId: i.fundId,
      fundName: i.fundName,
      type: i.type,
      invested: i.amount,
      units: Number(i.units.toFixed(4)),
      buyNav: i.nav,
      currentNav,
      currentValue: Math.round(currentValue * 100) / 100,
      gain: Math.round((currentValue - i.amount) * 100) / 100,
    };
  });

  const returns = Math.round((totalValue - totalInvested) * 100) / 100;
  return {
    investments,
    totalValue: Math.round(totalValue * 100) / 100,
    totalInvested: Math.round(totalInvested * 100) / 100,
    returns,
    returnsPct: totalInvested ? Math.round((returns / totalInvested) * 1000) / 10 : 0,
  };
}
