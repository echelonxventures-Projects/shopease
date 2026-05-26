/**
 * Deep-serialize any object for Next.js App Router server→client boundary.
 * Converts Prisma Decimal objects, Date objects, and BigInt to plain values.
 */
export function serializeForClient<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (typeof value === "object") {
    // Prisma Decimal → number
    if (typeof (value as any).toNumber === "function") {
      try {
        return (value as any).toNumber() as T;
      } catch {
        return Number(value) as any as T;
      }
    }

    // Date → ISO string
    if (value instanceof Date) {
      return value.toISOString() as T;
    }

    // BigInt → number
    if (typeof value === "bigint") {
      return Number(value) as T;
    }

    // Array
    if (Array.isArray(value)) {
      return value.map((item) => serializeForClient(item)) as T;
    }

    // Plain object — recurse
    const result: any = {};
    for (const key of Object.keys(value)) {
      result[key] = serializeForClient((value as any)[key]);
    }
    return result;
  }

  // Primitive (string, number, boolean)
  return value;
}

/**
 * Serialize a single product (or any Prisma model with Decimal fields).
 * Handles nested relations (category, brand, etc.).
 */
export function serializeProduct<T>(product: T): T {
  return serializeForClient(product);
}

/**
 * Serialize an array of products.
 */
export function serializeProducts<T extends any[]>(products: T): T {
  return serializeForClient(products);
}
