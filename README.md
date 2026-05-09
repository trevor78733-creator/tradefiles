# Trading Journal

A personal trading journal: log trades, see KPIs, charts, and a P&L calendar.

**Stack**: Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui (Base UI) · Recharts · Prisma 7 · Postgres · Vercel-ready

## Local development

Requirements: Node.js 20.9+ (use [nvm](https://github.com/nvm-sh/nvm): `nvm install --lts`).

```bash
# 1. install deps
npm install

# 2. start a local Postgres (Prisma's embedded dev server, no Docker)
npx prisma dev --detach
#   prints: postgres://postgres:postgres@localhost:51214/template1?sslmode=disable
#   (port may differ — check `npx prisma dev ls`)

# 3. fill in .env (copy from .env.example)
cp .env.example .env
#   - DATABASE_URL: the URL printed by `prisma dev`
#   - APP_PASSWORD: whatever you want to type to log in
#   - SESSION_SECRET: openssl rand -hex 32

# 4. push schema and seed sample data
npm run db:push
npm run db:seed   # 100+ synthetic demo trades

# 5. run dev server
npm run dev
# → http://localhost:3000
```

Sign in with the password you set in `.env`.

To stop the local Postgres: `npx prisma dev stop`. To wipe and restart: `npx prisma dev rm default && npx prisma dev --detach`.

## Deploying to Vercel + Neon

1. **Create a Neon Postgres database** at <https://neon.tech> (free tier, no credit card). Copy the pooled connection string.
2. **Push this repo to GitHub** and import it into Vercel.
3. In the Vercel project, set environment variables:
   - `DATABASE_URL` — the Neon connection string
   - `APP_PASSWORD` — your password
   - `SESSION_SECRET` — `openssl rand -hex 32`
4. After the first deploy, run schema push against Neon from your laptop:
   ```bash
   DATABASE_URL="<your-neon-url>" npx prisma db push
   ```
   (Optionally `npm run db:seed` for demo trades.)

## Architecture notes

- `app/(authed)/` — everything behind the password gate (Dashboard, Trade Log, forms)
- `app/login/` — password entry
- `app/api/auth/` — POST = sign in (sets HMAC-signed session cookie); DELETE = sign out
- `proxy.ts` — Next.js 16 proxy (was `middleware.ts` in v15) that gates routes
- `actions/trades.ts` — Server Actions: createTrade, updateTrade, deleteTrade
- `lib/db.ts` — Prisma client (uses `@prisma/adapter-pg`, required by Prisma 7)
- `lib/stats.ts` — pure functions for KPIs, daily/cumulative P&L, calendar grid
- `lib/auth.ts` — HMAC-signed cookie session, no third-party auth lib
- `prisma/schema.prisma` — `Account` + `Trade` models. Trades belong to an account so multi-account is a UI add later, not a migration.

## What's not in v1 (queued for later)

- CSV import from brokers (TopstepX, NinjaTrader, etc.)
- Multi-account UI (schema already supports it)
- Screenshot upload to Vercel Blob (currently you paste a URL)
- Real auth (multi-user, OAuth)
- Mobile-optimized layout polish
