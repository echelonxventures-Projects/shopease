/**
 * Environment variable validation — runs at startup.
 * Called from instrumentation.ts in production.
 */

interface EnvRequirement {
  name: string;
  required: boolean;
  validate?: (value: string) => string | null;
}

const REQUIRED_ENV_VARS: EnvRequirement[] = [
  {
    name: "DATABASE_URL",
    required: true,
    validate: (v) =>
      v.startsWith("postgresql://") || v.startsWith("prisma://")
        ? null
        : "DATABASE_URL must start with postgresql:// or prisma://",
  },
  {
    name: "NEXTAUTH_SECRET",
    required: true,
    validate: (v) =>
      v.length >= 32 ? null : "NEXTAUTH_SECRET must be at least 32 characters",
  },
  {
    name: "NEXTAUTH_URL",
    required: false,
  },
  {
    name: "VOUCHER_CODE_ENCRYPTION_KEY",
    required: true,
    validate: (v) =>
      /^[0-9a-f]{64}$/i.test(v)
        ? null
        : "VOUCHER_CODE_ENCRYPTION_KEY must be 64 hex characters",
  },
  {
    name: "PII_ENCRYPTION_KEY",
    required: true,
    validate: (v) =>
      /^[0-9a-f]{64}$/i.test(v)
        ? null
        : "PII_ENCRYPTION_KEY must be 64 hex characters",
  },
];

export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const env of REQUIRED_ENV_VARS) {
    const value = process.env[env.name];

    if (!value) {
      if (env.required) {
        errors.push(`Missing required env var: ${env.name}`);
      }
      continue;
    }

    if (env.validate) {
      const error = env.validate(value);
      if (error) errors.push(error);
    }
  }

  // Warn about test keys in production (opt out locally/staging with ALLOW_TEST_KEYS=true)
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_TEST_KEYS !== "true") {
    const rzp = process.env.RAZORPAY_KEY_ID;
    if (rzp && (rzp.startsWith("rzp_test_") || rzp.startsWith("dummy"))) {
      errors.push("RAZORPAY_KEY_ID appears to be a test key in production");
    }
    if (process.env.NEXTAUTH_SECRET?.includes("dummy") || process.env.NEXTAUTH_SECRET?.includes("change-me")) {
      errors.push("NEXTAUTH_SECRET contains placeholder value");
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateEnvOrExit(): void {
  const { valid, errors } = validateEnv();

  if (!valid) {
    console.error("\n=== Environment Validation Failed ===");
    for (const error of errors) {
      console.error(`  ERROR: ${error}`);
    }
    console.error("===============================\n");

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    } else {
      console.warn("WARN: Skipping exit in development mode");
    }
  }
}
