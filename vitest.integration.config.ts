import { defineConfig } from "vitest/config";
import path from "path";

// Integration tests run against a REAL database (no Prisma mock). Provide a test
// DATABASE_URL, e.g.:
//   DATABASE_URL="postgresql://USER@127.0.0.1:5432/ecommerce_test_db?schema=public" \
//     npx vitest run --config vitest.integration.config.ts
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    globals: true,
    environment: "node",
    include: ["src/tests/integration/**/*.test.ts"],
    fileParallelism: false,
  },
});
