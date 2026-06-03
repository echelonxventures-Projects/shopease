"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSession, isAdminRole } from "@/lib/auth";
import { validate, vId, vStr } from "@/lib/validate";
import { initializeProviders, getQuote, getHistoricalData, getCryptoHistory } from "@/lib/providers";
import { computeCharges } from "@/lib/trading/charges";
import { executeFill } from "@/lib/trading/matching-engine";
import { getServiceProvider } from "@/lib/config/services-config";

// ── Config ──────────────────────────────────────────────────────────────────

export async function getTradingConfig() {
  let config = await prisma.tradingConfig.findFirst();
  if (!config) config = await prisma.tradingConfig.create({ data: {} });
  return JSON.parse(JSON.stringify(config));
}

export async function updateTradingConfig(data: Record<string, unknown>) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  const existing = await prisma.tradingConfig.findFirst();
  if (existing) return prisma.tradingConfig.update({ where: { id: existing.id }, data: data as never });
  return prisma.tradingConfig.create({ data: data as never });
}

// ── Account ─────────────────────────────────────────────────────────────────

export async function getTradingAccount() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
}

export async function createTradingAccount(data: { panNumber?: string; dematId?: string; bankAccountId?: string; bankIfsc?: string }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  const existing = await prisma.tradingAccount.findUnique({ where: { userId } });
  if (existing) throw new Error("Trading account already exists");

  const accountNumber = `TRD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  // Grant trading platform access
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { platforms: true } });
  if (user && !user.platforms.includes("trading")) {
    await prisma.user.update({ where: { id: userId }, data: { platforms: { push: "trading" } } });
  }

  return prisma.tradingAccount.create({
    data: { userId, accountNumber, ...data, status: data.panNumber ? "ACTIVE" : "PENDING", kycStatus: data.panNumber ? "SUBMITTED" : "PENDING" },
  });
}

export async function addFunds(amount: number) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  validate(z.object({ amount: z.number().positive().max(10000000) }), { amount });

  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account || account.status !== "ACTIVE") throw new Error("Account not active");

  const balanceBefore = Number(account.fundsBalance);
  const updated = await prisma.tradingAccount.update({
    where: { id: account.id },
    data: { fundsBalance: { increment: amount } },
  });

  await prisma.tradingTransaction.create({
    data: { accountId: account.id, type: "DEPOSIT", amount, balanceBefore, balanceAfter: balanceBefore + amount, description: "Funds added" },
  });

  return updated;
}

export async function withdrawFunds(amount: number) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  validate(z.object({ amount: z.number().positive() }), { amount });

  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account || account.status !== "ACTIVE") throw new Error("Account not active");
  if (Number(account.fundsBalance) < amount) throw new Error("Insufficient funds");

  const balanceBefore = Number(account.fundsBalance);
  const updated = await prisma.tradingAccount.update({
    where: { id: account.id },
    data: { fundsBalance: { decrement: amount } },
  });

  await prisma.tradingTransaction.create({
    data: { accountId: account.id, type: "WITHDRAWAL", amount, balanceBefore, balanceAfter: balanceBefore - amount, description: "Funds withdrawn" },
  });

  return updated;
}

// ── Orders ──────────────────────────────────────────────────────────────────

export async function placeOrder(data: {
  assetId: string; orderType: string; side: string; quantity: number;
  price?: number; triggerPrice?: number; product?: string; validity?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = validate(z.object({
    assetId: vId,
    orderType: z.enum(["MARKET", "LIMIT", "STOP_LOSS", "STOP_LIMIT", "BRACKET", "COVER", "AMO", "GTT"]),
    side: z.enum(["BUY", "SELL"]),
    quantity: z.number().int().positive().max(100000),
    price: z.number().positive().optional(),
    triggerPrice: z.number().positive().optional(),
    product: z.enum(["CNC", "MIS", "NRML"]).default("CNC"),
    validity: z.enum(["DAY", "IOC", "GTC", "GTT"]).default("DAY"),
  }), data);

  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account || account.status !== "ACTIVE") throw new Error("Account not active");

  const asset = await prisma.tradingAsset.findUnique({ where: { id: input.assetId } });
  if (!asset || !asset.isTradeable) throw new Error("Asset not tradeable");

  // Check quantity is multiple of lot size
  if (input.quantity % asset.lotSize !== 0) throw new Error(`Quantity must be multiple of ${asset.lotSize}`);

  // Estimated execution price
  const marketData = await prisma.tradingMarketData.findFirst({ where: { assetId: input.assetId }, orderBy: { timestamp: "desc" } });
  const estimatedPrice = input.price || Number(marketData?.ltp || 0);
  const estimatedValue = estimatedPrice * input.quantity;
  if (input.orderType === "MARKET" && estimatedPrice <= 0) throw new Error("No market price available");

  // Full statutory charges (recomputed on actual fill by the engine)
  const config = await prisma.tradingConfig.findFirst();
  const charges = computeCharges({ config, side: input.side, product: input.product, value: estimatedValue });

  // Check funds for buy orders (value + charges)
  if (input.side === "BUY") {
    const available = Number(account.fundsBalance) - Number(account.blockedMargin);
    if (estimatedValue + charges.total > available) throw new Error("Insufficient funds");
  }

  // Check holdings for sell orders
  if (input.side === "SELL") {
    const holding = await prisma.tradingHolding.findUnique({ where: { accountId_assetId: { accountId: account.id, assetId: input.assetId } } });
    if (!holding || holding.quantity < input.quantity) throw new Error("Insufficient holdings");
  }

  const order = await prisma.tradingOrder.create({
    data: {
      accountId: account.id,
      assetId: input.assetId,
      orderType: input.orderType as never,
      side: input.side as never,
      quantity: input.quantity,
      price: input.price,
      triggerPrice: input.triggerPrice,
      product: input.product,
      validity: input.validity,
      isAMO: input.orderType === "AMO",
      brokerage: charges.brokerage,
      taxes: charges.total - charges.brokerage,
      totalCharges: charges.total,
      status: "OPEN",
      filledQuantity: 0,
    },
  });

  // MARKET orders execute immediately at LTP; resting orders are matched by the engine on price ticks.
  if (input.orderType === "MARKET") {
    const filled = await executeFill(order.id, estimatedPrice);
    return filled ?? order;
  }
  if (input.side === "BUY") {
    // Block margin for resting buy orders on the same basis we release it (price, else trigger).
    // Market-style resting orders (no price/trigger, e.g. AMO) are re-checked for funds at fill instead.
    const basis = input.price ?? input.triggerPrice;
    if (basis) await prisma.tradingAccount.update({ where: { id: account.id }, data: { blockedMargin: { increment: basis * input.quantity } } });
  }
  return order;
}

export async function cancelOrder(orderId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");

  const order = await prisma.tradingOrder.findFirst({ where: { id: orderId, accountId: account.id, status: { in: ["PENDING", "OPEN"] } } });
  if (!order) throw new Error("Order not found or cannot be cancelled");

  await prisma.tradingOrder.update({ where: { id: orderId }, data: { status: "CANCELLED", cancelledAt: new Date() } });

  // Release blocked margin (same basis used at placement: price, else trigger)
  const basis = order.side === "BUY" ? (order.price ?? order.triggerPrice) : null;
  if (basis) {
    const blockedAmount = Number(basis) * (order.quantity - order.filledQuantity);
    await prisma.tradingAccount.update({ where: { id: account.id }, data: { blockedMargin: { decrement: blockedAmount } } });
  }

  return { success: true };
}

export async function getOrders(status?: string) {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];

  return prisma.tradingOrder.findMany({
    where: { accountId: account.id, ...(status ? { status: status as never } : {}) },
    include: { asset: { select: { symbol: true, name: true, type: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ── Portfolio ───────────────────────────────────────────────────────────────

export async function getPortfolio() {
  const session = await getSession();
  if (!session?.user?.id) return { holdings: [], summary: { invested: 0, current: 0, pnl: 0, pnlPct: 0, dayChange: 0 } };

  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return { holdings: [], summary: { invested: 0, current: 0, pnl: 0, pnlPct: 0, dayChange: 0 } };

  const holdings = await prisma.tradingHolding.findMany({
    where: { accountId: account.id },
    include: { asset: { select: { symbol: true, name: true, type: true, logoUrl: true } } },
  });

  const invested = holdings.reduce((s, h) => s + Number(h.investedValue), 0);
  const current = holdings.reduce((s, h) => s + Number(h.currentValue), 0);
  const dayChange = holdings.reduce((s, h) => s + Number(h.dayChange), 0);

  return {
    holdings: JSON.parse(JSON.stringify(holdings)),
    summary: { invested, current, pnl: current - invested, pnlPct: invested > 0 ? ((current - invested) / invested) * 100 : 0, dayChange },
  };
}

// ── Watchlist ───────────────────────────────────────────────────────────────

export async function getWatchlists() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];

  return prisma.tradingWatchlist.findMany({
    where: { accountId: account.id },
    include: { items: { include: { asset: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function addToWatchlist(assetId: string, watchlistId?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");

  let wlId = watchlistId;
  if (!wlId) {
    const defaultWl = await prisma.tradingWatchlist.findFirst({ where: { accountId: account.id } });
    if (defaultWl) { wlId = defaultWl.id; }
    else {
      const created = await prisma.tradingWatchlist.create({ data: { accountId: account.id, name: "My Watchlist" } });
      wlId = created.id;
    }
  }

  await prisma.tradingWatchlistItem.upsert({
    where: { watchlistId_assetId: { watchlistId: wlId, assetId } },
    create: { watchlistId: wlId, assetId },
    update: {},
  });
  return { success: true };
}

export async function removeFromWatchlist(assetId: string, watchlistId: string) {
  await prisma.tradingWatchlistItem.deleteMany({ where: { watchlistId, assetId } });
  return { success: true };
}

// ── Market Data ─────────────────────────────────────────────────────────────

export async function searchAssets(query: string, type?: string) {
  return prisma.tradingAsset.findMany({
    where: {
      isActive: true,
      ...(type ? { type: type as never } : {}),
      OR: [
        { symbol: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { marketCap: "desc" },
  });
}

export async function getMarketData(assetId: string) {
  initializeProviders();
  // Try live API first
  const asset = await prisma.tradingAsset.findUnique({ where: { id: assetId } });
  if (asset) {
    try {
      const quote = await getQuote(asset.symbol);
      if (quote) return { id: "live", assetId, ltp: quote.price, open: quote.open, high: quote.high, low: quote.low, close: quote.close, volume: quote.volume, change: quote.change, changePct: quote.changePct, bid: 0, ask: 0, bidQty: 0, askQty: 0, timestamp: new Date() };
    } catch { /* fall through */ }
  }
  return prisma.tradingMarketData.findFirst({ where: { assetId }, orderBy: { timestamp: "desc" } });
}

export async function getTopMovers(limit = 10) {
  const gainers = await prisma.tradingMarketData.findMany({ orderBy: { changePct: "desc" }, take: limit, include: { asset: { select: { symbol: true, name: true } } } });
  const losers = await prisma.tradingMarketData.findMany({ orderBy: { changePct: "asc" }, take: limit, include: { asset: { select: { symbol: true, name: true } } } });
  return { gainers: JSON.parse(JSON.stringify(gainers)), losers: JSON.parse(JSON.stringify(losers)) };
}

// ── SIP ─────────────────────────────────────────────────────────────────────

export async function createSIP(data: { assetId: string; amount: number; frequency?: string; sipDate?: number }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const input = validate(z.object({
    assetId: vId,
    amount: z.number().positive().min(100, "Minimum SIP amount is ₹100"),
    frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).default("MONTHLY"),
    sipDate: z.number().int().min(1).max(28).default(1),
  }), data);

  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account || account.status !== "ACTIVE") throw new Error("Account not active");

  return prisma.tradingSIP.create({
    data: { accountId: account.id, assetId: input.assetId, amount: input.amount, frequency: input.frequency, sipDate: input.sipDate },
  });
}

export async function getSIPs() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];
  return prisma.tradingSIP.findMany({ where: { accountId: account.id }, include: { asset: { select: { symbol: true, name: true, type: true } } }, orderBy: { createdAt: "desc" } });
}

export async function cancelSIP(sipId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");
  return prisma.tradingSIP.update({ where: { id: sipId, accountId: account.id }, data: { status: "CANCELLED" } });
}

// ── Admin: Assets ───────────────────────────────────────────────────────────

export async function createAsset(data: {
  symbol: string; name: string; type: string; exchange?: string;
  sector?: string; isin?: string; lotSize?: number; logoUrl?: string;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  const input = validate(z.object({
    symbol: z.string().trim().min(1).max(20).toUpperCase(),
    name: vStr(200),
    type: z.enum(["STOCK", "ETF", "MUTUAL_FUND", "BOND", "COMMODITY", "CRYPTO", "FOREX", "FUTURES", "OPTIONS", "INDEX", "IPO", "SGB", "NPS", "FD"]),
    exchange: z.string().trim().max(20).default("NSE"),
    sector: z.string().trim().max(100).optional(),
    isin: z.string().trim().max(20).optional(),
    lotSize: z.number().int().positive().default(1),
    logoUrl: z.string().url().max(2048).optional().or(z.literal("")),
  }), data);

  return prisma.tradingAsset.create({ data: { ...input, name: input.name as string, type: input.type as never, symbol: input.symbol, logoUrl: input.logoUrl || undefined, sector: input.sector || undefined, isin: input.isin || undefined } });
}

export async function getAssets(type?: string, page = 1, limit = 50) {
  return prisma.tradingAsset.findMany({
    where: { isActive: true, ...(type ? { type: type as never } : {}) },
    orderBy: { symbol: "asc" },
    skip: (page - 1) * limit,
    take: limit,
  });
}

export async function getTransactions(limit = 50) {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];
  return prisma.tradingTransaction.findMany({ where: { accountId: account.id }, orderBy: { createdAt: "desc" }, take: limit });
}

// ── GTT Orders ──────────────────────────────────────────────────────────────

export async function createGTT(data: { assetId: string; triggerType: string; triggerPrice: number; limitPrice?: number; stopPrice?: number; side: "BUY" | "SELL"; quantity: number }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account || account.status !== "ACTIVE") throw new Error("No active trading account");
  return prisma.tradingGTT.create({
    data: { accountId: account.id, assetId: data.assetId, triggerType: data.triggerType, triggerPrice: data.triggerPrice, limitPrice: data.limitPrice, stopPrice: data.stopPrice, side: data.side, quantity: data.quantity },
  });
}

export async function getGTTOrders() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];
  return prisma.tradingGTT.findMany({ where: { accountId: account.id }, include: { asset: true }, orderBy: { createdAt: "desc" } });
}

export async function cancelGTT(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");
  return prisma.tradingGTT.update({ where: { id, accountId: account.id }, data: { status: "CANCELLED" } });
}

// ── IPO ─────────────────────────────────────────────────────────────────────

export async function getIPOs(status?: string) {
  return prisma.tradingIPO.findMany({
    where: { isActive: true, ...(status ? { status } : {}) },
    orderBy: { openDate: "desc" },
    include: { _count: { select: { applications: true } } },
  });
}

export async function getIPOById(id: string) {
  return prisma.tradingIPO.findUnique({ where: { id }, include: { _count: { select: { applications: true } } } });
}

export async function applyIPO(data: { ipoId: string; lots: number; bidPrice: number; upiId?: string }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account || account.status !== "ACTIVE") throw new Error("No active trading account");

  const ipo = await prisma.tradingIPO.findUnique({ where: { id: data.ipoId } });
  if (!ipo || ipo.status !== "OPEN") throw new Error("IPO is not open for application");
  if (data.lots < 1) throw new Error("Minimum 1 lot required");

  const amount = data.lots * ipo.lotSize * data.bidPrice;
  return prisma.tradingIPOApplication.create({
    data: { accountId: account.id, ipoId: data.ipoId, lots: data.lots, bidPrice: data.bidPrice, amount, upiId: data.upiId },
  });
}

export async function getMyIPOApplications() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];
  return prisma.tradingIPOApplication.findMany({ where: { accountId: account.id }, include: { ipo: true }, orderBy: { createdAt: "desc" } });
}

// Admin: create IPO
export async function createIPO(data: { name: string; symbol: string; exchange?: string; priceMin: number; priceMax: number; lotSize: number; issueSize?: number; openDate: string; closeDate: string; listingDate?: string; category?: string; description?: string; rhpUrl?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.tradingIPO.create({
    data: { name: data.name, symbol: data.symbol, exchange: data.exchange ?? "NSE", priceMin: data.priceMin, priceMax: data.priceMax, lotSize: data.lotSize, issueSize: data.issueSize, openDate: new Date(data.openDate), closeDate: new Date(data.closeDate), listingDate: data.listingDate ? new Date(data.listingDate) : null, category: data.category ?? "MAINBOARD", description: data.description, rhpUrl: data.rhpUrl },
  });
}

export async function updateIPOStatus(id: string, status: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.tradingIPO.update({ where: { id }, data: { status } });
}

// ── Mutual Funds ────────────────────────────────────────────────────────────

export async function getMutualFunds(category?: string) {
  return prisma.tradingMutualFund.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    orderBy: { aum: "desc" },
    take: 50,
  });
}

export async function getMutualFundById(id: string) {
  return prisma.tradingMutualFund.findUnique({ where: { id } });
}

export async function investInMF(data: { fundId: string; amount: number; type: string; sipDate?: number }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account || account.status !== "ACTIVE") throw new Error("No active trading account");

  const fund = await prisma.tradingMutualFund.findUnique({ where: { id: data.fundId } });
  if (!fund) throw new Error("Fund not found");
  if (data.amount < Number(fund.minInvestment) && data.type === "LUMPSUM") throw new Error(`Minimum investment is ₹${fund.minInvestment}`);
  if (data.amount < Number(fund.minSIP) && data.type === "SIP") throw new Error(`Minimum SIP is ₹${fund.minSIP}`);

  const units = data.amount / Number(fund.nav);
  return prisma.tradingMFInvestment.create({
    data: { accountId: account.id, fundId: data.fundId, type: data.type, units, invested: data.amount, current: data.amount, sipAmount: data.type === "SIP" ? data.amount : null, sipDate: data.sipDate },
  });
}

export async function getMyMFInvestments() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];
  return prisma.tradingMFInvestment.findMany({ where: { accountId: account.id, status: "ACTIVE" }, include: { fund: true }, orderBy: { createdAt: "desc" } });
}

export async function redeemMF(investmentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");
  return prisma.tradingMFInvestment.update({ where: { id: investmentId, accountId: account.id }, data: { status: "REDEEMED" } });
}

// Admin: create mutual fund
export async function createMutualFund(data: { name: string; symbol: string; category: string; subCategory?: string; amcName: string; nav: number; expenseRatio?: number; aum?: number; returns1Y?: number; returns3Y?: number; returns5Y?: number; riskLevel?: string; minInvestment?: number; minSIP?: number; exitLoad?: string; logoUrl?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.tradingMutualFund.create({ data: data as Prisma.TradingMutualFundUncheckedCreateInput });
}

// ── Price Alerts ────────────────────────────────────────────────────────────

export async function createAlert(data: { assetId: string; condition: string; targetPrice?: number; percentChange?: number }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");
  return prisma.tradingAlert.create({ data: { accountId: account.id, assetId: data.assetId, condition: data.condition, targetPrice: data.targetPrice, percentChange: data.percentChange } });
}

export async function getAlerts() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];
  return prisma.tradingAlert.findMany({ where: { accountId: account.id }, include: { asset: true }, orderBy: { createdAt: "desc" } });
}

export async function cancelAlert(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");
  return prisma.tradingAlert.update({ where: { id, accountId: account.id }, data: { status: "CANCELLED" } });
}

// ── Positions (Intraday) ────────────────────────────────────────────────────

export async function getPositions() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return [];
  return prisma.tradingPosition.findMany({ where: { accountId: account.id, isOpen: true }, include: { asset: true }, orderBy: { openedAt: "desc" } });
}

export async function closePosition(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");
  return prisma.tradingPosition.update({ where: { id, accountId: account.id }, data: { isOpen: false, closedAt: new Date() } });
}

// ── Order Book Depth ────────────────────────────────────────────────────────

export async function getOrderDepth(assetId: string) {
  const depth = await prisma.tradingOrderDepth.findUnique({ where: { assetId } });
  if (depth) return { bids: depth.bids, asks: depth.asks, source: "REAL" };

  // Deterministic 5-level synthetic book from LTP + tick size (no licensed L3 feed available).
  const [market, asset] = await Promise.all([
    prisma.tradingMarketData.findFirst({ where: { assetId }, orderBy: { timestamp: "desc" } }),
    prisma.tradingAsset.findUnique({ where: { id: assetId }, select: { tickSize: true } }),
  ]);
  const ltp = market ? Number(market.ltp) : 100;
  const tick = (asset ? Number(asset.tickSize) : 0) || 0.05;
  const baseQty = market ? Math.max(50, Math.floor(Number(market.volume ?? 0) / 1000) || 100) : 100;
  const round = (x: number) => +x.toFixed(2);
  const level = (i: number, dir: -1 | 1) => ({ price: round(ltp + dir * (i + 1) * tick), qty: baseQty * (5 - i), orders: (5 - i) * 2 + 1 });
  return {
    bids: Array.from({ length: 5 }, (_, i) => level(i, -1)),
    asks: Array.from({ length: 5 }, (_, i) => level(i, 1)),
    source: "SIMULATED",
  };
}

// ── Portfolio Analytics ─────────────────────────────────────────────────────

export async function getPortfolioAnalytics() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return null;

  const holdings = await prisma.tradingHolding.findMany({ where: { accountId: account.id }, include: { asset: true } });

  // Sector-wise allocation
  const sectorMap: Record<string, number> = {};
  let totalValue = 0;
  for (const h of holdings) {
    const val = Number(h.currentValue);
    totalValue += val;
    const sector = h.asset.sector || "Others";
    sectorMap[sector] = (sectorMap[sector] || 0) + val;
  }
  const sectorAllocation = Object.entries(sectorMap).map(([sector, value]) => ({ sector, value, percent: totalValue > 0 ? +((value / totalValue) * 100).toFixed(2) : 0 }));

  // Asset type allocation
  const typeMap: Record<string, number> = {};
  for (const h of holdings) {
    const val = Number(h.currentValue);
    typeMap[h.asset.type] = (typeMap[h.asset.type] || 0) + val;
  }
  const typeAllocation = Object.entries(typeMap).map(([type, value]) => ({ type, value, percent: totalValue > 0 ? +((value / totalValue) * 100).toFixed(2) : 0 }));

  // Top performers
  const sorted = [...holdings].sort((a, b) => Number(b.pnlPercent) - Number(a.pnlPercent));
  const topGainers = sorted.slice(0, 5).map((h) => ({ symbol: h.asset.symbol, pnl: Number(h.pnl), pnlPercent: Number(h.pnlPercent) }));
  const topLosers = sorted.slice(-5).reverse().map((h) => ({ symbol: h.asset.symbol, pnl: Number(h.pnl), pnlPercent: Number(h.pnlPercent) }));

  const totalInvested = holdings.reduce((s, h) => s + Number(h.investedValue), 0);
  const totalPnl = totalValue - totalInvested;

  return { totalValue, totalInvested, totalPnl, pnlPercent: totalInvested > 0 ? +((totalPnl / totalInvested) * 100).toFixed(2) : 0, holdingsCount: holdings.length, sectorAllocation, typeAllocation, topGainers, topLosers };
}

// ── Tax Report / P&L Statement ──────────────────────────────────────────────

export async function getTaxReport(financialYear?: string) {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) return null;

  // Resolve FY (Apr 1 – Mar 31). Accepts "YYYY-YYYY"; defaults to current FY.
  const now = new Date();
  let startYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const parsed = financialYear?.match(/^(\d{4})/);
  if (parsed) startYear = Number(parsed[1]);
  const fyStart = new Date(startYear, 3, 1);
  const fyEnd = new Date(startYear + 1, 2, 31, 23, 59, 59);

  // All filled trades up to FY end (oldest first) to rebuild FIFO lots and classify holding period.
  const orders = await prisma.tradingOrder.findMany({
    where: { accountId: account.id, status: "FILLED", filledAt: { lte: fyEnd } },
    orderBy: { filledAt: "asc" },
  });

  const LTCG_DAYS = 365;
  const lots: Record<string, { qty: number; price: number; date: Date }[]> = {};
  let shortTermGains = 0, longTermGains = 0, totalTurnover = 0, totalBrokerage = 0, totalTaxes = 0, sellTrades = 0;

  for (const o of orders) {
    const qty = o.filledQuantity;
    const price = Number(o.avgFilledPrice ?? 0);
    const when = o.filledAt ?? o.createdAt;
    if (!lots[o.assetId]) lots[o.assetId] = [];
    if (o.side === "BUY") { lots[o.assetId].push({ qty, price, date: when }); continue; }

    const inFY = when >= fyStart && when <= fyEnd;
    if (inFY) { totalTurnover += price * qty; totalBrokerage += Number(o.brokerage ?? 0); totalTaxes += Number(o.taxes ?? 0); sellTrades++; }
    let remaining = qty;
    const queue = lots[o.assetId];
    while (remaining > 0 && queue.length) {
      const lot = queue[0];
      const matched = Math.min(remaining, lot.qty);
      if (inFY) {
        const gain = (price - lot.price) * matched;
        const heldDays = (when.getTime() - lot.date.getTime()) / 86400000;
        if (heldDays > LTCG_DAYS) longTermGains += gain; else shortTermGains += gain;
      }
      lot.qty -= matched; remaining -= matched;
      if (lot.qty <= 0) queue.shift();
    }
  }

  const dividends = await prisma.tradingTransaction.findMany({
    where: { accountId: account.id, type: "DIVIDEND", createdAt: { gte: fyStart, lte: fyEnd } },
  });
  const dividendIncome = dividends.reduce((s, t) => s + Number(t.amount), 0);

  const round = (x: number) => Math.round(x * 100) / 100;
  return {
    financialYear: `${startYear}-${startYear + 1}`,
    shortTermGains: round(shortTermGains),
    longTermGains: round(longTermGains),
    totalTurnover: round(totalTurnover),
    totalBrokerage: round(totalBrokerage),
    totalTaxes: round(totalTaxes),
    dividendIncome: round(dividendIncome),
    netTaxableGains: round(shortTermGains + longTermGains),
    tradesCount: sellTrades,
  };
}

// ── Chart Data (OHLC) ───────────────────────────────────────────────────────

export async function getChartData(assetId: string, interval: string = "1D") {
  initializeProviders();
  // Try to get asset symbol for live API
  const asset = await prisma.tradingAsset.findUnique({ where: { id: assetId } });
  if (asset) {
    try {
      const rangeMap: Record<string, string> = { "1D": "5d", "1W": "1mo", "1M": "3mo", "3M": "6mo", "1Y": "1y", "5Y": "5y" };
      const range = rangeMap[interval] || "3mo";
      const liveData = asset.type === "CRYPTO"
        ? await getCryptoHistory(asset.symbol.toLowerCase(), interval === "1D" ? 7 : interval === "1W" ? 30 : 90)
        : await getHistoricalData(asset.symbol, range);
      if (liveData.length > 0) return liveData;
    } catch { /* fall through to DB/simulated */ }
  }

  const market = await prisma.tradingMarketData.findMany({ where: { assetId }, orderBy: { timestamp: "desc" }, take: 100 });
  if (market.length > 0) {
    return market.reverse().map((m) => ({ date: m.timestamp.toISOString(), open: Number(m.open), high: Number(m.high), low: Number(m.low), close: Number(m.close), volume: m.volume }));
  }

  // Simulated fallback
  const basePrice = 100 + Math.random() * 900;
  return Array.from({ length: 60 }, (_, i) => {
    const date = new Date(); date.setDate(date.getDate() - (60 - i));
    const open = basePrice + (Math.random() - 0.5) * 20;
    const close = open + (Math.random() - 0.5) * 10;
    return { date: date.toISOString(), open: +open.toFixed(2), high: +(Math.max(open, close) + Math.random() * 5).toFixed(2), low: +(Math.min(open, close) - Math.random() * 5).toFixed(2), close: +close.toFixed(2), volume: Math.floor(Math.random() * 1000000) };
  });
}

// ── KYC & Account Settings ──────────────────────────────────────────────────

export async function updateKYC(data: { panNumber?: string; dematId?: string; bankAccountId?: string; bankIfsc?: string; nomineeDetails?: Prisma.InputJsonValue }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");

  const updateData: Prisma.TradingAccountUpdateInput = {};
  if (data.panNumber) updateData.panNumber = data.panNumber;
  if (data.dematId) updateData.dematId = data.dematId;
  if (data.bankAccountId) updateData.bankAccountId = data.bankAccountId;
  if (data.bankIfsc) updateData.bankIfsc = data.bankIfsc;
  if (data.nomineeDetails) updateData.nomineeDetails = data.nomineeDetails;

  // Auto-update KYC status
  const updated = await prisma.tradingAccount.update({ where: { id: account.id }, data: updateData });
  if (updated.panNumber && updated.bankAccountId) {
    await prisma.tradingAccount.update({ where: { id: account.id }, data: { kycStatus: "SUBMITTED" } });
  }
  return updated;
}

/**
 * Verify KYC. Provider-pluggable eKYC/CKYC via getServiceProvider("kyc");
 * falls back to PAN/IFSC format validation when no aggregator is configured.
 * (Real eKYC/CKYC requires a licensed KRA integration we cannot provision here.)
 */
export async function verifyKYC() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");
  if (!account.panNumber || !account.bankAccountId) throw new Error("Complete KYC details (PAN + bank) before verification");

  const provider = getServiceProvider("kyc");
  let verified: boolean;
  let reason: string | undefined;
  if (provider) {
    const res = (await provider.execute("verify", { pan: account.panNumber, bankAccountId: account.bankAccountId, bankIfsc: account.bankIfsc, dematId: account.dematId })) as { verified?: boolean; reason?: string } | undefined;
    verified = !!res?.verified;
    reason = res?.reason;
  } else {
    const panOk = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(account.panNumber.toUpperCase());
    const ifscOk = !account.bankIfsc || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(account.bankIfsc.toUpperCase());
    verified = panOk && ifscOk;
    if (!verified) reason = !panOk ? "Invalid PAN format" : "Invalid IFSC format";
  }

  const updated = await prisma.tradingAccount.update({
    where: { id: account.id },
    data: { kycStatus: verified ? "VERIFIED" : "REJECTED", ...(verified ? { status: "ACTIVE" } : {}) },
  });
  return { verified, reason, kycStatus: updated.kycStatus };
}

/** SEBI-style contract note (charge break-up) for a filled order. */
export async function getContractNote(orderId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const account = await prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
  if (!account) throw new Error("No account");

  const order = await prisma.tradingOrder.findFirst({
    where: { id: orderId, accountId: account.id, status: "FILLED" },
    include: { asset: { select: { symbol: true, name: true, exchange: true, isin: true } } },
  });
  if (!order) throw new Error("Filled order not found");

  const qty = order.filledQuantity;
  const price = Number(order.avgFilledPrice ?? 0);
  const value = price * qty;
  const config = await prisma.tradingConfig.findFirst();
  const charges = computeCharges({ config, side: order.side, product: order.product, value });
  const net = order.side === "BUY" ? value + charges.total : value - charges.total;

  return {
    contractNoteNo: `CN-${order.id.slice(-10).toUpperCase()}`,
    date: order.filledAt,
    accountNumber: account.accountNumber,
    pan: account.panNumber,
    exchange: order.asset.exchange,
    symbol: order.asset.symbol,
    name: order.asset.name,
    isin: order.asset.isin,
    side: order.side,
    product: order.product,
    quantity: qty,
    price,
    tradeValue: Math.round(value * 100) / 100,
    charges,
    netAmount: Math.round(net * 100) / 100,
  };
}

export async function updateAccountSettings(data: { riskProfile?: string; isPaperTrading?: boolean }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.tradingAccount.update({ where: { userId: session.user.id as string }, data });
}

export async function getAccountDetails() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.tradingAccount.findUnique({ where: { userId: session.user.id as string } });
}
