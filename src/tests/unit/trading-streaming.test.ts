import { describe, it, expect } from "vitest";
import { computeCharges } from "@/lib/trading/charges";
import { fillPriceFor } from "@/lib/trading/matching-engine";
import { variantLadder, buildHlsManifest, generateAdBreaks } from "@/lib/streaming/playback";

const config = {
  brokerageType: "FLAT", brokerageFlat: 20, brokeragePercent: 0.03,
  sttRate: 0.1, exchangeCharges: 0.00345, sebiCharges: 0.0001,
  stampDutyRate: 0.015, gstRate: 18, dpCharges: 15.93,
};

describe("computeCharges", () => {
  it("applies STT + DP on a delivery sell and excludes stamp duty", () => {
    const c = computeCharges({ config, side: "SELL", product: "CNC", value: 100000 });
    expect(c.stt).toBeCloseTo(100, 2);
    expect(c.dp).toBe(15.93);
    expect(c.stampDuty).toBe(0);
    expect(c.gst).toBeCloseTo(4.24, 2); // 18% of (20 + 3.45 + 0.1)
    expect(c.total).toBeCloseTo(c.brokerage + c.stt + c.exchange + c.sebi + c.stampDuty + c.gst + c.dp, 2);
  });

  it("applies stamp duty on a buy and excludes STT/DP", () => {
    const c = computeCharges({ config, side: "BUY", product: "CNC", value: 100000 });
    expect(c.stampDuty).toBeCloseTo(15, 2);
    expect(c.stt).toBe(0);
    expect(c.dp).toBe(0);
  });

  it("supports percent brokerage", () => {
    const c = computeCharges({ config: { ...config, brokerageType: "PERCENT" }, side: "BUY", value: 100000 });
    expect(c.brokerage).toBeCloseTo(30, 2); // 0.03% of 100000
  });
});

describe("fillPriceFor", () => {
  const buyLimit = { orderType: "LIMIT", side: "BUY" as const, price: 100, triggerPrice: null };
  const sellLimit = { orderType: "LIMIT", side: "SELL" as const, price: 100, triggerPrice: null };

  it("fills MARKET at LTP", () => {
    expect(fillPriceFor({ orderType: "MARKET", side: "BUY", price: null, triggerPrice: null }, 123)).toBe(123);
  });

  it("fills a buy LIMIT only at/below the limit price", () => {
    expect(fillPriceFor(buyLimit, 101)).toBeNull();
    expect(fillPriceFor(buyLimit, 100)).toBe(100);
    expect(fillPriceFor(buyLimit, 95)).toBe(100);
  });

  it("fills a sell LIMIT only at/above the limit price", () => {
    expect(fillPriceFor(sellLimit, 99)).toBeNull();
    expect(fillPriceFor(sellLimit, 105)).toBe(100);
  });

  it("triggers a buy STOP_LOSS at/above the trigger and fills at LTP", () => {
    const sl = { orderType: "STOP_LOSS", side: "BUY" as const, price: null, triggerPrice: 110 };
    expect(fillPriceFor(sl, 109)).toBeNull();
    expect(fillPriceFor(sl, 112)).toBe(112);
  });

  it("respects both trigger and limit for STOP_LIMIT", () => {
    const sll = { orderType: "STOP_LIMIT", side: "BUY" as const, price: 115, triggerPrice: 110 };
    expect(fillPriceFor(sll, 109)).toBeNull(); // not triggered
    expect(fillPriceFor(sll, 112)).toBe(115); // triggered, within limit
    expect(fillPriceFor(sll, 120)).toBeNull(); // above limit
  });
});

describe("streaming playback", () => {
  it("caps the variant ladder to the plan quality", () => {
    expect(variantLadder("HD").map((v) => v.quality)).toEqual(["SD", "HD"]);
    expect(variantLadder("UHD_4K").length).toBe(4);
  });

  it("returns unavailable manifest without a source url", () => {
    expect(buildHlsManifest(null, "HD").available).toBe(false);
    const m = buildHlsManifest("https://cdn/x.m3u8", "FULL_HD");
    expect(m.available).toBe(true);
    expect(m.variants.length).toBe(3);
  });

  it("emits a pre-roll plus mid-rolls for long content", () => {
    expect(generateAdBreaks(120).filter((b) => b.type === "MID_ROLL").length).toBe(0);
    const long = generateAdBreaks(3600);
    expect(long[0].type).toBe("PRE_ROLL");
    expect(long.filter((b) => b.type === "MID_ROLL").length).toBeGreaterThan(0);
  });
});
