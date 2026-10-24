# Stok app progress

Last updated: 24 October 2026. Vocabulary follows [GLOSSARY.md](GLOSSARY.md); the plan is in [docs/artek-stok-crm-plan-ve-prompt.md](docs/artek-stok-crm-plan-ve-prompt.md).

## Where things are

| Issue | What | State | Branch / commit |
| --- | --- | --- | --- |
| #21 | Monorepo, site in `apps/ferritnuve` | Merged | `main` (#39) |
| #22 | Stok app shell, shared `packages/ui` | Merged | `main` (#40) |
| #23 | Stok Vercel project, Neon, Resend | Set up; the Neon preview-branch check remains (see Before go-live) | Vercel `artek-stok` · `stok.ferritnuve.com` |
| #24 | Database, invite-only login, roles + Lokasyon guard | Merged in [#41](https://github.com/artekelektronik/artek/pull/41); a deployed login is checked after `create-admin` | `df36d69` |
| #26 | Ürünler and the one-time import of the site's 92 products | Merged (#41) | `ec5b535` |
| #28 | Stock ledger: mal kabul, balances, Stok hareketleri | Merged (#41) | `fd41c5a` |
| #29 | Stok çıkışı: satış teslimatı, üretim tüketimi, fire | Merged (#41) | `283e1d1`, review fixes `f2ad02f` |
| #30 | Transfer: sevk and teslim alma | Merged (#41) | `3a45a7e` |
| #31 | Sayım without locks | Merged (#41) | `3ad3255` |
| #32 | Açılış sayımı (go-live per Lokasyon) | Merged (#41) | `32ba171` |
| #33 | Stok durumu, filters, CSV | Merged (#41) | `867eb01`, review fixes `f1e94b4` |
| #34 | Kritik seviye and email warnings | Merged (#41) | `a022ee8`, `b741c86`, `bac753e` |
| #25 | User management: invite, deactivate, audit log | Admin user management: invite by email, roles + Lokasyon, deactivate, password links, append-only audit log | `codex/stok-users` |
| #27 | Public catalog API; the site reads from it | Merged: `/api/catalog` (#42, brand added in #43); ferritnuve.com reads it (#44). `lib/products.json` retired | `main` |

#24 and #26–#34 were merged to `main` in PR [#41](https://github.com/artekelektronik/artek/pull/41) (merge commit `7fa35c2`), one commit per ticket. Production deployed it and ran the migrations on 24 October 2026.

## Kritik seviye (#34)

- A movement that takes a product's company total below its Kritik seviye writes one email to the `notification` outbox in the same transaction. Product rows are locked in a fixed order, so concurrent stock-outs send one email.
- The outbox is sent right after the request (`after()`). `/api/cron/outbox` (daily in `vercel.json`, protected by `CRON_SECRET`) retries failures. The notification id is Resend's idempotency key.
- Admins see every notification and choose the recipient roles under Bildirimler.
- Locally there is no Resend key, so notifications show as "Gönderilemedi: RESEND_API_KEY veya RESEND_FROM tanımlı değil." That's expected until #23.

## What the app does today

Sign in at `http://localhost:3001` (`pnpm dev` from the repo root). Screens: Stok durumu, Ürünler, Stok hareketleri, Mal kabul, Stok çıkışı, Transfer, Sayım, Açılış sayımı.

Rules the code and database enforce:

- Balances change only through movements, in one transaction with them. The database refuses edits and deletes of movements; mistakes are reversed with a reason (admin, mühendis), once.
- Available stock never goes below zero, even under concurrent requests; a repeated submission records once (idempotency key per form).
- Mağaza and depo sorumlusu act in, and see, only their own Lokasyon.
- A Lokasyon records nothing until its Açılış sayımı is approved; exactly one approved opening per Lokasyon.
- Stock on the way in a transfer counts at neither Lokasyon; a shortfall at receipt is closed as a loss with its reason.

## Decisions to confirm

- **Stock visibility:** mağaza and depo sorumlusu see balances and history only for their own Lokasyon (read from #33). The plan's roles table only says where they may *act*.
- **Product codes:** the site's "Product Code" is shared by several sizes, so it became the public Üretici kodu, and our unique code is `ART-<record number>`.
- **Reversals** are for admin and mühendis only; transfer movements can't be reversed (send the stock back instead).

## Before go-live

- #23 is in place, checked on 24 October 2026: Vercel project `artek-stok` (Root Directory `apps/stok`) on `stok.ferritnuve.com`. Neon and Resend are attached to it only, the Resend domain is verified, `BETTER_AUTH_SECRET` is set for Production and Preview, and `CRON_SECRET` for Production. Production builds run migrations on `DATABASE_URL_UNPOOLED` (`apps/stok/vercel.json`).
- Still to do in Vercel:
  - Check that Neon creates a branch per preview deployment. Previews don't migrate, so they show the production schema until their PR merges.
  - Optional: `RESEND_FROM` and `BETTER_AUTH_URL` for Preview, and a DMARC record for `ferritnuve.com` at Natro.
- After #41 merges, on the production database (its connection string is in the Neon console; `vercel env pull` hides Sensitive values):
  1. The production build has run the migrations.
  2. `pnpm --filter stok import-products`
  3. `pnpm --filter stok create-admin`
  4. An Açılış sayımı per Lokasyon.
- The local dev database (`artek_stok`) was reset on 24 October 2026; it keeps the 92 products and the local admin. Karaköy was opened with a test count (ART-0003 = 12, then a stock-out of 3).

## Local setup

See [apps/stok/README.md](apps/stok/README.md).

- Since 24 October 2026, local development uses the **production** Neon database (`apps/stok/.env.local`), so company data is entered once. Anything done through `pnpm dev` is real; dev and staging Neon branches come later.
- Never run `pnpm db:migrate` locally while `.env.local` points at production: production migrates in its Vercel build.
- The tests need their own throwaway Postgres in `TEST_DATABASE_URL` (its name must contain "test"); they refuse anything else.

## Notes

- The stok test suite (83 tests) normally takes about 30 s. With iCloud's `fileproviderd` / `cloudd` near 100% CPU it has taken over 10 minutes.
- After adding a new route folder, restart `pnpm dev`: the dev server's file watcher sometimes misses new `[id]` folders.
