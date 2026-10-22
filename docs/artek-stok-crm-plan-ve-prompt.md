# Artek — Stock, Manufacturing, Sales and CRM Plan

Date: 22 October 2026 (revised after the grilling session)

Vocabulary follows [GLOSSARY.md](../GLOSSARY.md). Decisions with lasting consequences are in [docs/adr/](adr/).

## 1. Why

Artek has no stock system. Stock lives in notebooks and Excel, nobody trusts the numbers, and work stops for repeated counts. The first goal is **balances people trust**: per product and Lokasyon, changed only by recorded Stok hareketi, established by an Açılış sayımı and kept honest by cheap Sayım.

Artek runs two businesses that share one stock system:

- **Karaköy Mağaza** resells Ticari mal (ferrite cores, toroids, filters) from stock.
- **Çekmeköy İmalathane** builds Özel trafo to customer requests, consuming Malzeme.

We build this ourselves (ADR-0001). It is for Artek only; SaaS is a possible future, not a design input.

## 2. Architecture (ADR-0002)

```
artek/  (pnpm workspaces + Turborepo)
  apps/stok         internal app; login required; only owner of the database
  apps/ferritnuve   current public site, moved here; read-only Vitrin
  apps/<brand>-shop later; a Satış kanalı that creates Sipariş through the stok app
  packages/ui       shared shadcn components
  packages/catalog  public catalog contract (zod schemas)
```

- **Stack:** Next.js (App Router) + TypeScript for every app, matching the current site. Better Auth for login and user management, Neon PostgreSQL for data, Resend for email, Drizzle for schema and migrations.
- **Vercel:** each app is its own Vercel project. A new project for `apps/stok` gets **Neon and Resend through the Vercel Marketplace, attached to that project only**, so env vars are managed by Vercel and the ferritnuve project never holds database or email credentials. Neon creates a database branch for each preview deployment. The existing ferritnuve project's Root Directory moves to `apps/ferritnuve`.
- **Vitrin:** ferritnuve.com shows every product marked "show on site" (on by default for Ticari mal) through the public catalog API. No quantities, no stock codes, no availability signal. `lib/products.json` is imported once into the stok app and then retired.
- **UI:** Turkish only for the stok app. Times stored in UTC and shown in Europe/Istanbul.

## 3. Stock model (ADR-0003)

- **One pile per product per Lokasyon.** No stock purposes, no locked güvence stock.
- **Physical / reserved / available:** available = physical − Rezervasyon. Stock in Transfer is in neither Lokasyon.
- **Kritik seviye** per product, set by the engineer; falling below it sends one notification and blocks nothing.
- **Units:** each product has one unit, with no conversions. Adet, takım and rulo are whole numbers; kg and metre allow 3 decimals.
- **Raf kodu:** an optional label per product per Lokasyon, used to sort count sheets. It is not a stock location.
- **Seri numarası:** every finished Özel trafo unit gets one. A finished unit enters stock at Çekmeköy already reserved for its Sipariş, and delivery takes it out.

### Invariants

- Balances change only through Stok hareketi; a confirmed movement is never edited or deleted, only reversed with a reason.
- Every movement records product, quantity, Lokasyon (from/to), user, time, reason and related document.
- Available stock can't go negative, two concurrent requests can't take the same last unit, and a retried request doesn't create a second movement.
- Related movements and balance changes commit together or not at all.
- Products and Lokasyon with history are archived, never deleted.

### Movement types

Açılış, mal kabul, Transfer sevk / teslim alma, satış teslimatı, müşteri iadesi, üretim tüketimi, üretimden iade, mamul girişi, fire, sayım düzeltmesi. Phase 1 already supports sale delivery and production consumption as **manual movements** (no Sipariş or Üretim emri yet), so balances stay true from launch day.

### Transfer

Sevk takes the quantity out of the source Lokasyon. Teslim alma records the quantity received into the target Lokasyon. Any shortfall is closed at receipt with a reason (lost / damaged); there is no long-lived "partially received" state.

### Sayım (no locks)

A count is a session per Lokasyon, with sheets ordered by Raf kodu. Each line stores the counted quantity and the moment it was counted. The difference is counted − balance at that moment, so sales after that moment don't distort it. An authorized user approves, which creates sayım düzeltmesi movements exactly once. Work never stops for a count. The Açılış sayımı is the same flow starting from zero balances.

## 4. Roles

Four fixed roles live in code: admin, mühendis (engineer), mağaza sorumlusu (store manager) and depo sorumlusu (warehouse manager). Each user gets one or more roles plus the Lokasyon they can act in. Every permission check runs on the server. Admins invite users (no public sign-up), deactivate them, send password resets and end sessions. The last active admin can't be removed. Changes to users and roles are audit-logged.

| Action | Admin | Mühendis | Mağaza sorumlusu | Depo sorumlusu |
|---|---|---|---|---|
| Users and roles | ✓ | | | |
| Products, Kritik seviye | ✓ | ✓ | view | view |
| Mal kabul, Transfer | ✓ | ✓ | own Lokasyon | own Lokasyon |
| Manual stock-out (sale, consumption, fire) | ✓ | ✓ | own Lokasyon | own Lokasyon |
| Sayım (count) | ✓ | ✓ | own Lokasyon | own Lokasyon |
| Approve Sayım differences | ✓ | ✓ | | |

## 5. Phases

| Phase | Scope | Done when |
|---|---|---|
| 0 — Architecture | Monorepo, stok app, Vercel project with Neon + Resend, auth, roles | An invited user logs into the deployed stok app; ferritnuve.com deploys from the monorepo unchanged |
| 1 — Trusted stock | Products + catalog import, Vitrin API, movements, mal kabul, manual stock-out, Transfer, Sayım, Açılış sayımı, overview | Both Lokasyon go live from an Açılış sayımı and every balance is explained by its movements |
| 2 — Warnings | Kritik seviye, email notifications (outbox, no duplicates) | Crossing a minimum level sends exactly one email |
| 3 — Sipariş and CRM | Customers, contacts, notes, follow-ups, Sipariş for Ticari mal, Rezervasyon, partial delivery, returns | Stock and reservations stay consistent from order to delivery |
| 4 — Manufacturing | Recipes (versioned), Üretim emri from a Sipariş line, consumption, fire, returns, serial-numbered finished units | A finished order's material and product movements add up |
| 5 — Second brand shop | Online shop as a Satış kanalı creating Sipariş through the stok app | Online orders reserve stock with no duplicate movements |

Phases 3–5 are broken into tickets after Phase 1 is live.

## 6. Out of scope (for now)

Accounting, e-invoicing, payments, purchase orders, automatic purchasing, lot tracking for materials, stock per shelf, multi-company/SaaS.

## 7. Agent prompt

```text
Read GLOSSARY.md, docs/adr/ and docs/artek-stok-crm-plan-ve-prompt.md
before starting. Pick the next open GitHub issue labelled ready-for-agent
whose blockers are closed, and implement only that ticket. Use the glossary
vocabulary, respect the ADRs, keep the invariants in §3, and stop when the
ticket's acceptance criteria are verified.
```
