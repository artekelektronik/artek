# Artek Stok

Internal stock app. Turkish only; times are stored in UTC and shown in Europe/Istanbul. Only this app connects to the database (ADR-0002).

## Environment variables

Names only; never commit values. Locally they live in `apps/stok/.env.local` (gitignored).

| Name | Used for |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection (Neon in Vercel, a local Postgres in development) |
| `DATABASE_URL_UNPOOLED` | Direct Neon connection for migrations (from the Neon integration); falls back to `DATABASE_URL` |
| `BETTER_AUTH_SECRET` | Signs session cookies; generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | The app's own URL, e.g. `http://localhost:3001` |
| `TEST_DATABASE_URL` | A separate, throwaway database for the integration tests |
| `RESEND_API_KEY` | Sends Kritik seviye emails (from the Resend integration) |
| `RESEND_FROM` | Sender address on the verified Resend domain, e.g. `Artek Stok <stok@…>` |
| `CRON_SECRET` | Protects `/api/cron/outbox`; Vercel Cron sends it automatically |

## Local setup

```bash
brew install postgresql@17 && brew services start postgresql@17
createdb artek_stok && createdb artek_stok_test
# write apps/stok/.env.local with the variables above
pnpm --filter stok db:migrate                                   # schema + both Lokasyon
pnpm --filter stok create-admin you@example.com "Ad Soyad"      # first admin; asks for a password
pnpm dev                                                        # http://localhost:3001
```

## Database

- Schema: `db/schema.ts`. After changing it run `pnpm --filter stok db:generate` and commit the new file in `drizzle/`.
- Lokasyon are rows, seeded by the `drizzle/0001_seed-lokasyon.sql` migration.

## Deploy

- Vercel project `artek-stok` (Merve's projects), Root Directory `apps/stok`, domain `stok.ferritnuve.com`. Neon and Resend are attached to this project only; the site's `artek` project has no database or email variables (ADR-0002).
- Production builds run `pnpm db:migrate` before `next build` (`vercel.json`). Preview builds don't migrate, so a pull request can't change the production schema before it merges.
- The Neon and Resend variables are marked Sensitive, so `vercel env pull` doesn't return them. To run `create-admin` or `import-products` against production, copy the connection string from the Neon console into `DATABASE_URL` for that one command.

## Access

- There is no sign-up: users are created by an admin, and the first admin by `create-admin`.
- Every page that reads data and every action that changes it calls `requirePermission(headers, action, lokasyonId)` from `lib/guard.ts`. It loads the user's roles and Lokasyon from the database and applies the table in `lib/permissions.ts`. The `(app)` layout's session check and `proxy.ts` only redirect visitors; they are not access control.
- Sign-in goes through `/api/auth`, where Better Auth rate-limits attempts (in production, counted in the `rate_limit` table).

## Kritik seviye emails

A movement that takes a product's company total below its Kritik seviye writes one email to the `notification` outbox in the same transaction, so a Resend failure never undoes stock. The outbox is sent right after the request (`after()`), and `vercel.json` runs `/api/cron/outbox` daily to retry failures (Vercel Hobby allows daily crons; on Pro it can run more often). Each email uses its notification id as Resend's idempotency key, so a retry never sends twice. Admins see every notification and choose the recipient roles under Bildirimler.

## Tests

`pnpm --filter stok test`. The integration tests migrate and use `TEST_DATABASE_URL`, and are skipped when it is not set.
