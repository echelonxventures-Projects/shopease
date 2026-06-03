import { vi } from "vitest";

// ===================== MOCK localStorage (zustand persist) =====================

if (typeof globalThis.localStorage === "undefined" || typeof globalThis.localStorage.setItem !== "function") {
  const store = new Map<string, string>();
  const localStorageMock: Storage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, String(v)),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, configurable: true });
}

// ===================== MOCK PRISMA =====================

export const mockPrisma = {
  $queryRaw: vi.fn().mockResolvedValue([{ "1": 1 }]),
  product: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  cartItem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    upsert: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  order: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
  },
  $use: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// ===================== MOCK NEXT-AUTH =====================

export function createMockSession(overrides = {}) {
  return {
    user: {
      id: "user_123",
      email: "test@example.com",
      name: "Test User",
      role: "CUSTOMER",
      ...overrides,
    },
  };
}

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue(null),
}));

// ===================== GLOBAL TEST UTILITIES =====================

export function createMockProduct(overrides = {}) {
  return {
    id: "prod_123",
    name: "Test Product",
    price: 999,
    stock: 10,
    isActive: true,
    ...overrides,
  };
}

export function createMockCartItem(overrides = {}) {
  return {
    id: "cart_123",
    userId: "user_123",
    productId: "prod_123",
    quantity: 1,
    variantId: null,
    product: createMockProduct(),
    ...overrides,
  };
}
