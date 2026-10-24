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
| `BLOB_READ_WRITE_TOKEN` | Product image uploads to Vercel Blob (store `artek-stok-images`, connected to this project only) |
| `NEXT_PUBLIC_VITRIN_URL` | Optional; where image paths of old imports live (default `https://www.ferritnuve.com`) |
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

- There is no sign-up: the first admin is created by `create-admin`, everyone else is invited by an admin under Kullanıcılar.
- An invite emails a link to `/sifre-belirle`, where the user sets their own password (link valid 7 days; a reset link sent later is valid 1 hour). The link is a Better Auth reset-password token, so nobody, admins included, ever sees or sets someone else's password.
- Anyone can ask for a reset link under "Şifremi unuttum" (`/sifremi-unuttum`): Better Auth rate-limits it, answers the same for every email, and sends nothing to a deactivated user. The link is valid 1 hour.
- Deactivating a user ends their sessions, voids unused links and blocks sign-in; users are never deleted, so their movements keep their name. The last active admin can't be deactivated or lose the admin role.
- Every change to a user, their roles or Lokasyon is written to the append-only `audit_log` (who, when, before and after), shown on the user's page.
- Every page that reads data and every action that changes it calls `requirePermission(headers, action, lokasyonId)` from `lib/guard.ts`. It loads the user's roles and Lokasyon from the database and applies the table in `lib/permissions.ts`. The `(app)` layout's session check and `proxy.ts` only redirect visitors; they are not access control.
- Sign-in goes through `/api/auth`, where Better Auth rate-limits attempts (in production, counted in the `rate_limit` table).

## Product images

Images live in Vercel Blob. The product form uploads them from the browser straight to Blob (`/api/urunler/gorsel` only issues the upload token, to users who may manage products; JPEG, PNG, WebP, AVIF or GIF up to 5 MB), and keeps their order: the first is the main image shown in lists and on the site. An image taken off a product is deleted from Blob when the product is saved, unless another product still shows it. `pnpm --filter stok move-images-to-blob` copies images that still point at the site (`/products-images/…`) into Blob; it is safe to run again.

## Public catalog

`GET /api/catalog` is public and read-only: every Vitrin reads its products here (ADR-0002). It returns products marked "show on site" and not archived, whatever their stock, with only the fields in the `@artek/catalog` contract (`packages/catalog`) and never quantities, stock codes, Raf kodu or prices. The CDN caches it for 5 minutes and may serve it stale for a day if the app is unreachable.

## Kritik seviye emails

A movement that takes a product's company total below its Kritik seviye writes one email to the `notification` outbox in the same transaction, so a Resend failure never undoes stock. The outbox is sent right after the request (`after()`), and `vercel.json` runs `/api/cron/outbox` daily to retry failures (Vercel Hobby allows daily crons; on Pro it can run more often). Each email uses its notification id as Resend's idempotency key, so a retry never sends twice. Admins see every notification and choose the recipient roles under Bildirimler.

## Tests

`pnpm --filter stok test`. The integration tests migrate and use `TEST_DATABASE_URL`, and are skipped when it is not set.
