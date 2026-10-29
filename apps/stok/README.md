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
| `CRON_SECRET` | Protects `/api/cron/*`; Vercel Cron sends it automatically |
| `ANTHROPIC_API_KEY` | The morning assistant (Claude) that prepares call plans and email drafts; without it the Bugün screen stays empty |

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
- Kullanıcılar shows a permission map: one row per person and one column per capability (stock, products, the two panels, management). It is worked out from `lib/permissions.ts` by `lib/capabilities.ts`, so it shows exactly what the app enforces. The ⋯ at the end of a row changes roles, Lokasyon and panel permissions in one save, with a live preview.
- Every change to a user, their roles, Lokasyon or panels is written to the append-only `audit_log` (who, when, before and after), shown on the user's page.
- Every page that reads data and every action that changes it calls `requirePermission(headers, action, lokasyonId)` from `lib/guard.ts`. It loads the user's roles and Lokasyon from the database and applies the table in `lib/permissions.ts`. The `(app)` layout's session check and `proxy.ts` only redirect visitors; they are not access control.
- Sign-in goes through `/api/auth`, where Better Auth rate-limits attempts (in production, counted in the `rate_limit` table).

## Product images

Images live in Vercel Blob. The product form uploads them from the browser straight to Blob (`/api/urunler/gorsel` only issues the upload token, to users who may manage products; JPEG, PNG, WebP, AVIF or GIF up to 5 MB), and keeps their order: the first is the main image shown in lists and on the site. An image taken off a product is deleted from Blob when the product is saved, unless another product still shows it. `pnpm --filter stok move-images-to-blob` copies images that still point at the site (`/products-images/…`) into Blob; it is safe to run again.

## Faturalar, Finans and Müşteriler

Two private panels, ADR-0004. Each admin gets them one by one under Kullanıcılar → Panel izinleri, at view or edit level: Artek Müşteri Paneli (`crm.*`) and Artek Finans Paneli (`finance.*`, where uploading needs edit). Invoice PDFs from QNB Dijital Köprü are uploaded at `/faturalar`; the browser unzips a zip and posts each PDF to `/api/faturalar` (one PDF per request, 4 MB max). An invoice is stored once per ETTN with its lines and the PDF's text; the PDF itself isn't kept. Customers are created from the buyer's VKN/TCKN. Finans and Müşteriler are calculated from the invoices on every request. The daily cron emails artek@ferritnuve.com after 7 days without a new invoice and sends Müşteri paneli holders the customers whose follow-up date has come.

Contact routes researched outside the repo (`iletisim.json`) are loaded from Müşteriler → "İletişim bilgilerini yükle" (Müşteri paneli edit rights), or with `pnpm --filter stok import-crm-contacts <file.json>`. Either way, only empty fields are filled and weak matches are skipped. The script writes to whatever database `DATABASE_URL` names; `.env.local` points at the local database.

## Bugün: the morning assistant

Every morning at 08:00 Istanbul (`/api/cron/asistan`), `lib/assistant.ts` picks up to 10 customers:

- customers whose Takip date has come, by the Takip channel on their card;
- up to 5 lapsed or one-off customers it proposes itself, each at most once every 30 days, and only when every earlier suggestion is closed.

For each one, Claude (`claude-opus-5-5`, web search and fetch) reads the customer's site and recent news, combines them with our invoices and notes, and writes a call plan or an email draft. Nothing is sent automatically.

On `/musteriler/bugun` every open item is one short row; the picked one opens on the right (on a phone, in place of the list), and when it is closed the next one opens. A person with Müşteri paneli edit rights works through the list:

- **Calls:** record a call with a note and the day it was made.
- **Emails:** edit a draft and press Gönder. The email goes from artek@ferritnuve.com, replies go to that inbox, and the signature and opt-out line are added automatically.
- **Yapılamadı:** close it with a reason. People manage the reasons at `/musteriler/sebepler` (`lib/reasons.ts`). Each reason has one effect: never suggest again (closed down, or not interested), suggest again after N days, or just a note. A removed reason is archived, so suggestions closed with it keep its label. When the reason does nothing and the person wrote a note, Claude (`claude-haiku-5-5`) reads the note and proposes an effect, and a new company name if there is one. The proposal shows under "Notlardan çıkan öneriler" and changes nothing until someone presses Uygula.
- **Sonraya bırak:** the chosen day becomes the customer's Takip date, and that morning a fresh suggestion is prepared.
- **Onay bekliyor:** note what we wait for. Every 3 days the card comes back to ask "Onaylandı mı?".

Three working days after an email or call, a "Sonuç ne oldu?" card asks what came of it. The answers are Cevap geldi, Teklif istendi / verildi, Sipariş geldi, Cevap yok and İlgilenmiyor. Teklif, Sipariş and İlgilenmiyor also set the CRM status. Cevap yok can take a date and channel for the next try. If a sales invoice for that customer arrived after the contact, the card says so and preselects Sipariş geldi. "Sonra sor" asks again 3 working days later, twice at most; the third time it records "Sonuç girilmedi". These cards don't hold up new suggestions.

A suggestion that is not closed stays under "Önceki günlerden kalanlar", and a late Takip is marked "N gün gecikti". While any is open, the assistant proposes no customers of its own. Takip dates still come on their day. Once all are closed, "Daha fazla öneri hazırla" prepares more the same day.

Every action is written to the customer's notes. A customer marked "e-posta istemiyor" gets no more email drafts. The 09:00 morning email lists the day's suggestions.

## Public catalog

`GET /api/catalog` is public and read-only: every Vitrin reads its products here (ADR-0002). It returns products marked "show on site" and not archived, whatever their stock, with only the fields in the `@artek/catalog` contract (`packages/catalog`) and never quantities, stock codes, Raf kodu or prices. The CDN caches it for 5 minutes and may serve it stale for a day if the app is unreachable.

## Kritik seviye emails

A movement that takes a product's company total below its Kritik seviye writes one email to the `notification` outbox in the same transaction, so a Resend failure never undoes stock. The outbox is sent right after the request (`after()`), and `vercel.json` runs `/api/cron/outbox` daily to retry failures (Vercel Hobby allows daily crons; on Pro it can run more often). Each email uses its notification id as Resend's idempotency key, so a retry never sends twice. Admins see every notification and choose the recipient roles under Bildirimler.

## Tests

`pnpm --filter stok test`. The integration tests migrate and use `TEST_DATABASE_URL`, and are skipped when it is not set.
