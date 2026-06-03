#!/bin/sh
set -e

PRISMA="node node_modules/prisma/build/index.js"

echo "[entrypoint] Applying database schema..."
# Prefer versioned migrations (proper history). On a database that was previously
# created with `db push` (tables already exist), migrate deploy will error — in
# that case fall back to the idempotent `db push` to bring it in sync.
if $PRISMA migrate deploy; then
  echo "[entrypoint] migrate deploy succeeded."
else
  echo "[entrypoint] migrate deploy not applicable; falling back to db push."
  if [ "$DB_ACCEPT_DATA_LOSS" = "true" ]; then
    $PRISMA db push --skip-generate --accept-data-loss
  else
    $PRISMA db push --skip-generate
  fi
fi

# Ensure the default platform site exists (idempotent).
echo "[entrypoint] Ensuring default site..."
node scripts/ensure-default-site.mjs || echo "[entrypoint] default-site seed skipped (non-fatal)."

# Optional one-time demo data: set SEED_ON_START=true.
if [ "$SEED_ON_START" = "true" ]; then
  echo "[entrypoint] Seeding demo data..."
  $PRISMA db seed || echo "[entrypoint] demo seed skipped/failed (non-fatal)."
fi

echo "[entrypoint] Starting Next.js server..."
exec node server.js
