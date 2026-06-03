import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Project-wide rule overrides.
  // `@next/next/no-img-element` is a perf hint, not a correctness rule.
  // Migrating to `next/image` requires per-case work (width/height or `fill`,
  // positioned parents, remotePatterns config). Disabled until migrated.
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // React Native app — not part of the Next.js project; lints incorrectly.
    "mobile/**",
  ]),
]);

export default eslintConfig;
