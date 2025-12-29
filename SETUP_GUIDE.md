# Analytics & SEO Setup

This document describes the analytics and SEO tools that have been added to your Next.js application.

## 🔧 What Was Added

### 1. **Google Analytics (GA4)**
- **Location**: [app/[locale]/layout.tsx](app/[locale]/layout.tsx)
- **Implementation**: Using Next.js `<Script>` component with `afterInteractive` strategy
- **Features**:
  - Automatic page view tracking
  - Locale tracking (tr/en)
  - Non-blocking script loading for optimal performance

### 2. **Posthog Analytics**
- **Location**: [components/analytics-provider.tsx](components/analytics-provider.tsx)
- **Implementation**: Client-side provider integrated into app providers
- **Features**:
  - Automatic pageview tracking on route changes
  - Locale tracking for each event
  - Autocapture enabled for user interactions
  - Page leave tracking
  - Identified users only (privacy-friendly)

### 3. **SEO Enhancements**
- **Location**: [app/[locale]/layout.tsx](app/[locale]/layout.tsx)
- **Features**:
  - Google Search Console verification meta tag
  - Open Graph tags for social sharing
  - Twitter Card metadata
  - Canonical URLs
  - Alternate language links (hreflang)
  - Robots meta tags with optimal crawling settings

### 4. **Sitemap Generation**
- **Location**: [app/sitemap.ts](app/sitemap.ts)
- **Implementation**: Build-time generation with ISR (1-hour revalidation)
- **Features**:
  - Static pages (home, products, about, certificates, contact)
  - Dynamic product pages fetched from Airtable
  - Bilingual URLs (Turkish without prefix, English with /en)
  - Alternate language links for SEO
  - Automatic lastModified timestamps

### 5. **Robots.txt**
- **Location**: [app/robots.ts](app/robots.ts)
- **Features**:
  - Allows all crawlers
  - Disallows API routes and admin areas
  - Links to sitemap.xml

### 6. **Next-Sitemap Configuration**
- **Location**: [next-sitemap.config.js](next-sitemap.config.js)
- **Features**:
  - Post-build sitemap generation
  - i18n support with hreflang alternates
  - Custom transformation for Turkish/English URLs

## 🔑 Environment Variables

Add these to your `.env` file (see [.env.example](.env.example)):

```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Search Console
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your_verification_code_here

# Posthog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Site URL (important for sitemap)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## 📦 New Dependencies

```json
{
  "posthog-js": "^1.310.2",
  "next-sitemap": "^4.2.3"
}
```

## 🚀 How to Get Started

### Google Analytics
1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new GA4 property
3. Copy your Measurement ID (starts with `G-`)
4. Add it to `NEXT_PUBLIC_GA_MEASUREMENT_ID` in your `.env`

### Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property
3. Choose "HTML tag" verification method
4. Copy the verification code
5. Add it to `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in your `.env`
6. Submit your sitemap: `https://yourdomain.com/sitemap.xml`

### Posthog
1. Sign up at [Posthog](https://posthog.com)
2. Create a new project
3. Copy your Project API Key (starts with `phc_`)
4. Add it to `NEXT_PUBLIC_POSTHOG_KEY` in your `.env`
5. If self-hosting, update `NEXT_PUBLIC_POSTHOG_HOST`

### Site URL
1. Set `NEXT_PUBLIC_SITE_URL` to your production domain
2. This is used for sitemap and metadata generation

## 🏗️ Build & Deploy

The sitemap is generated automatically during build:

```bash
pnpm build
```

This will:
1. Build your Next.js application
2. Generate `sitemap.xml` in the `public/` folder
3. Include all static pages and dynamic product pages from Airtable

The sitemap will be available at: `https://yourdomain.com/sitemap.xml`

## 📊 How Analytics Work

### Page View Tracking
- **Google Analytics**: Automatically tracks all page views
- **Posthog**: Manually captures pageviews on route changes with locale context

### Event Tracking
Both analytics tools support custom event tracking. Example:

```typescript
// In any client component
import posthog from 'posthog-js';

// Track custom event
posthog.capture('button_clicked', {
  button_name: 'contact_form',
  locale: 'tr'
});

// For Google Analytics
window.gtag('event', 'button_click', {
  button_name: 'contact_form',
  locale: 'tr'
});
```

## 🌐 SEO Best Practices Implemented

### 1. **Bilingual URLs**
- Turkish: `https://yourdomain.com/products`
- English: `https://yourdomain.com/en/products`

### 2. **Hreflang Tags**
Every page includes alternate language links for proper international SEO:
```html
<link rel="alternate" hreflang="tr" href="https://yourdomain.com/products" />
<link rel="alternate" hreflang="en" href="https://yourdomain.com/en/products" />
```

### 3. **Canonical URLs**
Each page has a canonical URL to prevent duplicate content issues.

### 4. **Open Graph**
Social sharing optimized with OG tags for Facebook, LinkedIn, etc.

### 5. **Sitemap Updates**
The sitemap automatically regenerates every hour (ISR) to include new products without requiring a full rebuild.

## 🔍 Verify Everything Works

### Check Analytics
1. **GA4**: Real-time reports in Google Analytics
2. **Posthog**: Session recordings and event stream

### Check SEO
1. **Sitemap**: Visit `https://yourdomain.com/sitemap.xml`
2. **Robots**: Visit `https://yourdomain.com/robots.txt`
3. **Metadata**: View page source and check `<head>` tags
4. **Search Console**: Submit sitemap and check indexing status

### Test Locally
```bash
pnpm dev
# Visit http://localhost:3000/sitemap.xml
# Visit http://localhost:3000/robots.txt
# Check browser console for analytics initialization
```

## 🎯 Performance Impact

- **Google Analytics**: Loaded with `afterInteractive` strategy (doesn't block rendering)
- **Posthog**: Initialized client-side only when keys are present
- **Sitemap**: Generated at build time with 1-hour ISR (no runtime cost)

## 📈 Next Steps

### Recommended Actions:
1. ✅ Fill in environment variables
2. ✅ Deploy to production
3. ✅ Submit sitemap to Google Search Console
4. ✅ Verify ownership in Search Console
5. ✅ Monitor analytics for data flow
6. ⚠️ Consider adding cookie consent for GDPR compliance
7. ⚠️ Add structured data (JSON-LD) for rich snippets
8. ⚠️ Implement `generateStaticParams` for product pages (better SEO)

## 📝 Files Modified/Created

### Created:
- [components/analytics-provider.tsx](components/analytics-provider.tsx)
- [app/sitemap.ts](app/sitemap.ts)
- [app/robots.ts](app/robots.ts)
- [next-sitemap.config.js](next-sitemap.config.js)
- [.env.example](.env.example)
- SETUP_GUIDE.md (this file)

### Modified:
- [components/providers.tsx](components/providers.tsx) - Added AnalyticsProvider
- [app/[locale]/layout.tsx](app/[locale]/layout.tsx) - Added GA scripts & enhanced metadata
- [package.json](package.json) - Added postbuild script

## 🐛 Troubleshooting

### Analytics not working?
- Check browser console for errors
- Verify environment variables are set (with `NEXT_PUBLIC_` prefix)
- Check that keys are valid
- Try in incognito mode (ad blockers may interfere)

### Sitemap empty?
- Check Airtable connection
- Verify `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`
- Check build logs for errors

### Products not in sitemap?
- Ensure products have "Product Name" field
- Run `pnpm build` to regenerate
- Wait 1 hour for ISR to update (or rebuild)

## 📚 Resources

- [Next.js Metadata Docs](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Analytics Setup](https://support.google.com/analytics/answer/9304153)
- [Posthog Next.js Docs](https://posthog.com/docs/libraries/next-js)
- [Next-Sitemap Docs](https://github.com/iamvishnusankar/next-sitemap)
- [Google Search Console](https://search.google.com/search-console)
