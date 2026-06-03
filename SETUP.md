# Self-Hosting Guide

Launch your own instance. The **only required configuration is your domain** plus
three generated secrets and a database password. Everything else has safe defaults.

## 1. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable | What to set |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your public URL, e.g. `https://shop.example.com` |
| `NEXTAUTH_URL` | Same as above |
| `DB_PASSWORD` | A strong database password |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `VOUCHER_CODE_ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `PII_ENCRYPTION_KEY` | `openssl rand -hex 32` (different value) |

Generate all three secrets at once:

```bash
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo "VOUCHER_CODE_ENCRYPTION_KEY=$(openssl rand -hex 32)"
echo "PII_ENCRYPTION_KEY=$(openssl rand -hex 32)"
```

Branding, payments (Razorpay), email/SMS, Redis, and external search are all
**optional** — see the commented sections in `.env.example`.

## 2. Run with Docker (production)

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

On startup the app container automatically syncs the database schema
(`prisma db push`) and then starts. Visit your domain.

To load demo data on first boot, set `SEED_ON_START=true` in `.env` (one-off),
or run the seed manually (see below).

## 3. Run locally (development)

```bash
# Start Postgres only
docker compose up -d db

cp .env.example .env   # then edit secrets + DATABASE_URL
npm install
npx prisma db push     # create the schema
npm run seed           # optional: demo data
npm run dev            # http://localhost:3000
```

## 4. Provider defaults (zero extra setup)

| Capability | Default (no config) | Optional upgrade |
|-----------|---------------------|------------------|
| Job queue | In-process (`memory`) | `bullmq` + `REDIS_URL` |
| Search | PostgreSQL full-text | Meilisearch / Typesense |
| Cache | In-memory | Redis (`REDIS_URL`) |
| Email | No-op unless configured | Resend / SendGrid |
| SMS | No-op unless configured | Twilio |
| Payments | Disabled unless configured | Razorpay |

## 5. Notes

- Secrets live only in `.env`, which is git-ignored. Never commit real secrets.
- In production, startup validation (`src/lib/env-validation.ts`) refuses to boot
  if a required secret is missing or a placeholder/test key is detected.
- The DB schema is synced with `prisma db push`. Destructive changes are blocked
  by default; set `DB_ACCEPT_DATA_LOSS=true` only when you intend them.
- Health check: `GET /api/health` (and `/api/health/deep` for a DB check).
