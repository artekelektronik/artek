# Monorepo, with the stok app as the only owner of the data

This repo becomes a pnpm + Turborepo monorepo: the internal stock app (`apps/stok`), the ferritnuve.com Vitrin (`apps/ferritnuve`) and, later, the second brand's shop live side by side and share UI and the public catalog contract. Only the stok app connects to the Neon database; storefronts read a public catalog API that exposes published product details and never quantities, and the future shop creates orders through the stok app so stock is reserved in one place. Each app is its own Vercel project, and Neon and Resend are attached through the Vercel Marketplace to the stok project only.

## Considered Options

- **One Next.js app for site and stock**: rejected; the public site and an authenticated ops app would share deploys, auth surface and blast radius.
- **Separate repositories**: rejected for now; one small team on one stack would duplicate the catalog contract and UI. The stok app can be split out if it becomes a SaaS product.
