# Artek Elektronik

Two apps live in this repository:

- **ferritnuve.com**, the bilingual public website and product catalog (`apps/ferritnuve`).
- **Artek Stok**, the internal stock app at [stok.ferritnuve.com](https://stok.ferritnuve.com) (`apps/stok`). The website reads its products from it. See [Stock app (Artek Stok)](#stock-app-artek-stok) below.

The bilingual website and product catalog for Artek Elektronik. The checked-in
catalog contains ferrite cores, iron powder cores, and power/EMI filters from
multiple manufacturers. Other product groups use introductory pages. Manufacturing
scope and historical claims require company confirmation before they are published.

## Website

The landing page is designed around product discovery and qualified customer
inquiries:

- Prominent product, series, and product-code search
- Direct access to the main magnetic-component categories
- Responsive product and capability sections
- Custom engineering and quotation calls to action
- Sticky, high-contrast navigation
- Turkish and English content
- Search-engine metadata, sitemap, robots directives, and structured data

The product catalog also supports filtering, sorting, pagination, shareable URL
state, and localized product detail pages.

## Technology

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS and shadcn/ui
- next-intl for Turkish and English localization
- TanStack Query for product data
- nuqs for URL-based catalog state
- Motion for interface animation
- Vercel Analytics and Speed Insights

## Local development

Requirements:

- Node.js
- pnpm

```bash
git clone https://github.com/artekelektronik/artek.git
cd artek
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Turkish is the default
locale; the English site is available at `/en`.

## Environment variables

Create `apps/ferritnuve/.env.local` as needed:

```env
# Canonical production URL used by metadata and sitemap generation
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Product data: the stok app's public catalog (this is the default)
CATALOG_URL=https://stok.ferritnuve.com/api/catalog

# Customer contact
NEXT_PUBLIC_WHATSAPP_PHONE=905327183364

# Optional analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Optional Google Search Console verification
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=verification_token
```

Never commit `.env.local` or production credentials.

## Commands

The repository is a pnpm workspace run with Turborepo. From the repository root:

```bash
pnpm dev                        # Start the site (:3000) and the stok app (:3001)
pnpm lint                       # Run ESLint
pnpm test                       # Run behaviour tests
pnpm build                      # Create a production build
pnpm --filter ferritnuve start  # Serve the site's production build
pnpm --filter stok start        # Serve the stok app's production build
```

Before opening a pull request, run:

```bash
pnpm lint
pnpm build
```

## Project structure

```text
apps/ferritnuve/            ferritnuve.com Vitrin (Next.js app)
  app/
    [locale]/               Localized pages
    api/products/           Product API routes
    sitemap.ts              Generated sitemap
    robots.ts               Search crawler rules
  components/
    hero-section.tsx        Product-discovery homepage hero
    header.tsx              Responsive navigation and search
    search-dialog.tsx       Site and product search
    product-*.tsx           Catalog interface
  i18n/                     Locale routing and navigation
  lib/                      Product data, taxonomy, and SEO helpers
  messages/
    tr.json                 Turkish content
    en.json                 English content
  public/                   Product imagery, certificates, operations demo
apps/stok/                  Internal stock app (Turkish, Europe/Istanbul times)
packages/ui/                Shared shadcn/Radix UI primitives (@artek/ui)
docs/                       Plan, ADRs and agent docs
```

## Stock app (Artek Stok)

The internal app for stock, products and users: Turkish only, times in Istanbul. The website gets its product list from it, so a product edited here changes on ferritnuve.com within a few minutes.

### Using it (no setup needed)

1. Open **[stok.ferritnuve.com](https://stok.ferritnuve.com)**. It works in any browser, on phones too.
2. There is no sign-up. An admin invites you under **Kullanıcılar → Kullanıcı davet et**, and you get an email from Artek Stok.
3. Open the link in that email (valid for 7 days) and set your own password. Nobody else, admins included, ever sees it.
4. Sign in with your email and password.
   - Forgot your password? Click **Şifremi unuttum** on the login page. A reset link valid for 1 hour comes by email.
   - The invite link expired? Ask an admin to press **Daveti yeniden gönder** on your user page.

What each role can do (an admin assigns roles and Lokasyon):

| Role | Can do |
| --- | --- |
| Yönetici (admin) | Everything, including users, roles and Bildirimler |
| Mühendis | Products and Kritik seviye, all stock work in every Lokasyon, approving counts, reversing movements |
| Mağaza sorumlusu / Depo sorumlusu | Mal kabul, Stok çıkışı, Transfer and Sayım in their own Lokasyon; they see stock only there |

Main screens: **Ana sayfa** (dashboard), **Stok durumu**, **Stok hareketleri**, **Mal kabul**, **Stok çıkışı**, **Transfer**, **Sayım**, **Açılış sayımı**, **Ürünler** (with images and the "Sitede" switch), **Bildirimler** and **Kullanıcılar** (admins). Tables keep their filters in the address bar, so you can bookmark or share a filtered view.

Before a Lokasyon can record stock, its **Açılış sayımı** (opening count) has to be done and approved. The dashboard warns while one is missing.

### Running it on your computer (developers)

Requirements: Node.js 24 and pnpm 10 (`corepack enable` gives you the right pnpm).

```bash
git clone https://github.com/artekelektronik/artek.git
cd artek
pnpm install
```

The app needs `apps/stok/.env.local`. **Ask an admin for its values**: they are never committed, and this repository is public. The variable names and what they are for are in [apps/stok/README.md](apps/stok/README.md#environment-variables).

```bash
pnpm --filter stok dev      # only the stok app: http://localhost:3001
pnpm dev                    # the site (:3000) and the stok app (:3001) together
```

Sign in with the same account you use on stok.ferritnuve.com.

> **Careful:** for now, `.env.local` points at the **production** database, so company data is entered once. Anything you save while running locally (stock movements, products, images, users) is real. Stock movements can't be deleted, only reversed. Never run `pnpm --filter stok db:migrate` on your computer; production migrates itself when a pull request is merged.

To experiment without touching real data, use your own local Postgres instead. The steps are under *Local setup* in [apps/stok/README.md](apps/stok/README.md#local-setup).

Tests need their own throwaway database, whose name must contain `test`; they refuse anything else:

```bash
TEST_DATABASE_URL=postgres://localhost/artek_stok_test pnpm --filter stok test
```

### Where it runs

- Vercel project **`artek-stok`** (team *Merve's projects*). It deploys from `main`, and every pull request gets a preview. Previews may share the production database, so don't save anything there either.
- **Neon** (database), **Resend** (email) and **Vercel Blob** (product images) are attached to this project only. The website's project has none of these credentials.
- More detail (deploys, migrations, images, permissions): [apps/stok/README.md](apps/stok/README.md).

## Main routes

These are the website's routes.

| Route | Purpose |
| --- | --- |
| `/` | Turkish homepage |
| `/en` | English homepage |
| `/products` | Product catalog |
| `/products/[slug]` | Product details |
| `/ferrit-nuve` | Ferrite core landing page |
| `/bobin` | Bobbin landing page |
| `/transformator` | Transformer landing page |
| `/about` | Company information |
| `/contact` | Contact and quotation requests |

Localized navigation is handled automatically by next-intl.

## Repository workflow

Create feature branches with the `codex/` prefix, keep unrelated local files
out of commits, and submit changes through pull requests.

This repository is public on GitHub but its contents are proprietary to Artek Elektronik. Never commit passwords, keys or `.env` files.
