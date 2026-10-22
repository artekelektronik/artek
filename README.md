# Artek Elektronik

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

Create `.env.local` as needed:

```env
# Canonical production URL used by metadata and sitemap generation
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Product data source
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id

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

```bash
pnpm dev       # Start the development server
pnpm lint      # Run ESLint
pnpm build     # Create a production build
pnpm start     # Serve the production build
```

Before opening a pull request, run:

```bash
pnpm lint
pnpm build
```

## Project structure

```text
app/
  [locale]/                 Localized pages
  api/products/             Product API routes
  sitemap.ts                Generated sitemap
  robots.ts                 Search crawler rules
components/
  hero-section.tsx          Product-discovery homepage hero
  header.tsx                Responsive navigation and search
  search-dialog.tsx         Site and product search
  product-*.tsx             Catalog interface
  ui/                       Shared UI primitives
i18n/                       Locale routing and navigation
lib/                        Product data, taxonomy, and SEO helpers
messages/
  tr.json                   Turkish content
  en.json                   English content
public/                     Product imagery and certificates
```

## Main routes

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

This repository is private and proprietary to Artek Elektronik.
