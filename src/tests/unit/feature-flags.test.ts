import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the configService dependency before importing the module under test
vi.mock("@/lib/config/config-service", () => ({
  configService: {
    getJSON: vi.fn(),
  },
}));

vi.mock("@/lib/config/config-keys", () => ({
  CONFIG_KEYS: { FEATURE_FLAGS: "feature_flags" },
}));

import { isFlagEnabled, getAllFlags, type FeatureFlag } from "@/lib/feature-flags";
import { configService } from "@/lib/config/config-service";

const mockedGetJSON = vi.mocked(configService.getJSON);

function makeFlag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  return {
    key: "test_flag",
    enabled: true,
    rolloutPercentage: 100,
    ...overrides,
  };
}

describe("Feature Flag Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic enable/disable", () => {
    it("returns false when flag is missing", async () => {
      mockedGetJSON.mockResolvedValue({});
      const result = await isFlagEnabled("missing");
      expect(result).toBe(false);
    });

    it("returns false when flag is disabled", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ enabled: false }),
      });
      const result = await isFlagEnabled("test_flag");
      expect(result).toBe(false);
    });

    it("returns true when flag is enabled at 100% rollout", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag(),
      });
      const result = await isFlagEnabled("test_flag");
      expect(result).toBe(true);
    });
  });

  describe("rollout percentage", () => {
    it("returns false for 0% rollout", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ rolloutPercentage: 0 }),
      });
      const result = await isFlagEnabled("test_flag");
      expect(result).toBe(false);
    });

    it("uses consistent hashing — same userId always gets same result", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ rolloutPercentage: 50 }),
      });
      const a = await isFlagEnabled("test_flag", { userId: "user-1" });
      const b = await isFlagEnabled("test_flag", { userId: "user-1" });
      expect(a).toBe(b);
    });
  });

  describe("targeting", () => {
    it("returns true for explicitly targeted user even at 0% rollout", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ rolloutPercentage: 0, targetUserIds: ["vip-1"] }),
      });
      const result = await isFlagEnabled("test_flag", { userId: "vip-1" });
      expect(result).toBe(true);
    });

    it("returns false when user role does not match targetRoles", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ targetRoles: ["ADMIN"] }),
      });
      const result = await isFlagEnabled("test_flag", {
        userId: "u-1",
        userRole: "CUSTOMER",
      });
      expect(result).toBe(false);
    });

    it("returns true when user role matches targetRoles", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ targetRoles: ["ADMIN"] }),
      });
      const result = await isFlagEnabled("test_flag", {
        userId: "u-1",
        userRole: "ADMIN",
      });
      expect(result).toBe(true);
    });

    it("returns false when region does not match targetRegions", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ targetRegions: ["US"] }),
      });
      const result = await isFlagEnabled("test_flag", {
        userId: "u-1",
        regionId: "IN",
      });
      expect(result).toBe(false);
    });
  });

  describe("expiry", () => {
    it("returns false when flag has expired", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ expiresAt: "2000-01-01T00:00:00Z" }),
      });
      const result = await isFlagEnabled("test_flag");
      expect(result).toBe(false);
    });

    it("returns true when flag is not yet expired", async () => {
      const futureDate = new Date(Date.now() + 86_400_000).toISOString();
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({ expiresAt: futureDate }),
      });
      const result = await isFlagEnabled("test_flag");
      expect(result).toBe(true);
    });
  });

  describe("conditions", () => {
    it("evaluates eq condition", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({
          conditions: [{ attribute: "plan", operator: "eq", value: "premium" }],
        }),
      });
      const yes = await isFlagEnabled("test_flag", {
        userId: "u-1",
        attributes: { plan: "premium" },
      });
      const no = await isFlagEnabled("test_flag", {
        userId: "u-1",
        attributes: { plan: "free" },
      });
      expect(yes).toBe(true);
      expect(no).toBe(false);
    });

    it("evaluates in condition", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({
          conditions: [{ attribute: "country", operator: "in", value: ["IN", "US"] }],
        }),
      });
      const result = await isFlagEnabled("test_flag", {
        userId: "u-1",
        attributes: { country: "IN" },
      });
      expect(result).toBe(true);
    });

    it("evaluates gt condition", async () => {
      mockedGetJSON.mockResolvedValue({
        test_flag: makeFlag({
          conditions: [{ attribute: "age", operator: "gt", value: 18 }],
        }),
      });
      const result = await isFlagEnabled("test_flag", {
        userId: "u-1",
        attributes: { age: 25 },
      });
      expect(result).toBe(true);
    });
  });

  describe("getAllFlags", () => {
    it("returns a record of evaluated flags", async () => {
      mockedGetJSON.mockResolvedValue({
        flag_a: makeFlag({ key: "flag_a" }),
        flag_b: makeFlag({ key: "flag_b", enabled: false }),
      });
      const result = await getAllFlags();
      expect(result).toEqual({ flag_a: true, flag_b: false });
    });
  });
});
