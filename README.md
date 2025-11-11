# Artek - Product Catalog Platform

A modern, high-performance product catalog platform built with Next.js 15, featuring advanced filtering, caching, and URL-based state management.

## 🚀 Features

### **Core Functionality**
- 📦 **Product Catalog** - Browse and search through products with advanced filtering
- 🔍 **Smart Filtering** - Filter by category, price, stock status, supplier country, and more
- 🔗 **Deep Linking** - Shareable URLs with all filters preserved (`/products?categories=PEM&inStock=true`)
- ⚡ **Performance Optimized** - TanStack Query for caching, prefetching, and background updates
- 📱 **Responsive Design** - Mobile-first design with adaptive grid layouts
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS

### **Advanced Features**
- **URL State Management** - nuqs for shareable and bookmarkable filtered views
- **Automatic Caching** - Smart data caching with automatic invalidation
- **Hover Prefetching** - Instant navigation with prefetched product details
- **Background Refetching** - Real-time stock updates every 5 minutes
- **Optimistic Updates** - Instant UI feedback for mutations
- **Type-Safe** - Full TypeScript support throughout

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **State Management:** 
  - [TanStack Query](https://tanstack.com/query) - Server state & caching
  - [nuqs](https://nuqs.47ng.com/) - URL state management
- **Database:** Airtable
- **Package Manager:** pnpm

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/hasanharman/artek.git
cd artek

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your Airtable credentials

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🔧 Environment Variables

Create a `.env.local` file with the following:

```env
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_base_id
```

## 📁 Project Structure

```
artek/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Homepage
│   ├── products/
│   │   ├── page.tsx           # Products list with filters
│   │   └── [id]/
│   │       └── page.tsx       # Product detail page
│   └── api/
│       └── products/
│           └── route.ts       # Products API endpoint
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── product-card.tsx       # Product card component
│   ├── product-filters.tsx    # Filter sidebar
│   ├── product-controls.tsx   # Sort & grid controls
│   ├── product-navigation.tsx # Navigation menu
│   └── providers.tsx          # React Query & nuqs providers
├── hooks/
│   ├── use-products.ts        # Product queries
│   ├── use-product-mutations.ts # Product mutations
│   └── use-infinite-products.ts # Infinite scroll
├── lib/
│   ├── api/
│   │   └── products.ts        # API functions
│   ├── airtable.ts            # Airtable client
│   └── utils.ts               # Utility functions
└── types/
    └── airtable.ts            # TypeScript types
```

## 🎯 Key Features

### **URL-Based Filtering**
All filters are stored in the URL for easy sharing:

```
/products?categories=PEM&inStock=true&sort=price-asc&page=2
```

### **TanStack Query Integration**
- Automatic request deduplication
- Smart caching (5min stale time, 10min garbage collection)
- Background refetching every 5 minutes
- Hover prefetching for instant navigation
- Optimistic updates for mutations

### **Product Filtering**
- Category, Alt Category, Product Type
- Price range slider
- Stock availability
- Supplier country
- Multiple sorting options

## 🚀 Scripts

```bash
# Development
pnpm dev          # Start dev server

# Building
pnpm build        # Build for production
pnpm start        # Start production server

# Linting
pnpm lint         # Run ESLint
```

## 📖 Documentation

- [TanStack Query Implementation](./TANSTACK_QUERY_IMPLEMENTATION.md)
- [nuqs URL State Management](./NUQS_IMPLEMENTATION.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)

## 🔗 Deep Linking Examples

Navigate directly to filtered product views:

- All Products: `/products`
- PEM Category: `/products?categories=PEM`
- Ferrit Category: `/products?categories=Ferrit`
- In Stock Items: `/products?inStock=true`
- Price Range: `/products?minPrice=100&maxPrice=500`
- Sorted by Price: `/products?sort=price-asc`

## 🎨 UI Features

- **Equal Height Cards** - Consistent product card sizes across the grid
- **Sticky Filters** - Filter sidebar stays visible while scrolling
- **Responsive Grid** - 2 or 3 column layouts
- **Loading States** - Skeleton screens for better UX
- **Error Handling** - Graceful error messages

## 🔄 Performance Optimizations

- **Memoization** - useMemo for expensive computations
- **Code Splitting** - Automatic route-based splitting
- **Image Optimization** - Next.js Image component
- **Font Optimization** - Geist font family with next/font
- **Request Caching** - TanStack Query cache layer

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 🆘 Support

For support, email support@artek.com or open an issue on GitHub.

---

Built with ❤️ by Artek Team
