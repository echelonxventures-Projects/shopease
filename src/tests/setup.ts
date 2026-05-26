import { vi } from "vitest";

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
