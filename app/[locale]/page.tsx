import { setRequestLocale } from "next-intl/server";
import { getMessages } from "next-intl/server";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import HeroSection from "@/components/hero-section";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Factory, Globe2, Headphones, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  getLanguageAlternates,
  getLocalizedPath,
  getOgImageUrl,
  getSiteUrl,
} from "@/lib/seo";
import { productCatalogPaths } from "@/lib/product-taxonomy";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages({ locale });
  const allMetadata = messages.metadata as Record<string, { title: string; description: string }>;
  const metadata = allMetadata.home;
  const siteUrl = await getSiteUrl();
  const localizedPath = getLocalizedPath(locale);

  return {
    title: metadata.title,
    description: metadata.description,
    alternates: {
      canonical: `${siteUrl}${localizedPath}`,
      languages: getLanguageAlternates(siteUrl),
    },
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: `${siteUrl}${localizedPath}`,
      type: "website",
      images: [
        {
          url: getOgImageUrl(siteUrl, locale),
          width: 1200,
          height: 630,
          alt: "Artek Elektronik - Premium Magnetic Components",
        },
      ],
    },
  };
}

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();

  const products = [
    { key: "hero1", image: "/products/core.png", href: productCatalogPaths.ferrit },
    { key: "hero2", image: "/products/bobbins.png", href: productCatalogPaths.pem },
    { key: "hero3", image: "/products/feritte-transformers.png", href: productCatalogPaths.ferrit },
    { key: "hero4", image: "/products/laminated-transformers.png", href: "/transformator" },
  ] as const;

  const secondaryProducts = [
    { key: "inductors", image: "/products/inductors.png", href: productCatalogPaths.ironPowder },
    { key: "powerInductors", image: "/products/power-inductors.png", href: productCatalogPaths.ironPowder },
    { key: "emcFilters", image: "/products/emc-filters.png", href: productCatalogPaths.pem },
    { key: "airCoreCoils", image: "/products/air-core-coils.png", href: "/contact" },
  ] as const;

  return (
    <div className="bg-[#f4f6f8]">
      <HeroSection />

      <section className="px-6 pb-20 pt-8 sm:pb-28 sm:pt-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 border-b border-slate-200 pb-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                {t("homeKeywords.learnMore")}
              </p>
              <h2 className="max-w-2xl text-pretty text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {t("homeKeywords.sectionTitle")}
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
              {t("homeKeywords.sectionSubtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {products.map((product, index) => (
              <Link
                key={product.key}
                href={product.href}
                className="group relative isolate min-h-[460px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-10"
              >
                <div className="relative z-10 max-w-sm">
                  <span className="text-xs font-bold text-emerald-600">0{index + 1}</span>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                    {t(`home.${product.key}.title`)}
                  </h3>
                  <p className="mt-3 text-base text-slate-600">
                    {t(`home.${product.key}.subtitle`)}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#142d42]">
                    {t("buttons.viewProducts")}
                    <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 h-[58%] w-[72%]">
                  <div className="absolute inset-0 rounded-tl-[6rem] bg-gradient-to-br from-slate-50 to-emerald-50" />
                  <Image
                    src={product.image}
                    alt={t(`home.${product.key}.title`)}
                    fill
                    sizes="(max-width: 768px) 75vw, 35vw"
                    className="object-contain p-8 transition duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#142d42] px-6 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                {t("feature.performance.highlight")}
              </p>
              <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
                {t("feature.title")}
              </h2>
            </div>
            <p className="text-lg leading-8 text-slate-300">{t("feature.subtitle")}</p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-3xl bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { key: "certified", icon: ShieldCheck },
              { key: "performance", icon: BadgeCheck },
              { key: "leading", icon: Globe2 },
              { key: "support", icon: Headphones },
            ].map(({ key, icon: Icon }) => (
              <div key={key} className="bg-[#19364d] p-7 lg:min-h-80">
                <span className="grid size-12 place-items-center rounded-xl bg-emerald-400 text-[#142d42]">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-8 text-xl font-semibold">{t(`feature.${key}.title`)}</h3>
                <p className="mt-4 text-sm leading-6 text-slate-300">{t(`feature.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                {t("nav.products")}
              </p>
              <h2 className="text-4xl font-semibold tracking-tight text-slate-950">
                {t("homeKeywords.sectionTitle")}
              </h2>
            </div>
            <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#142d42]">
              {t("buttons.viewProducts")} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {secondaryProducts.map((product) => (
              <Link
                key={product.key}
                href={product.href}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-50 to-emerald-50">
                  <Image
                    src={product.image}
                    alt={t(`home.grid.${product.key}.title`)}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-contain p-8 transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-950">
                    {t(`home.grid.${product.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {t(`home.grid.${product.key}.description`)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl bg-emerald-400 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-9 sm:p-14">
            <Factory className="size-10 text-[#142d42]" />
            <h2 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight text-[#10293d] sm:text-5xl">
              {t("feature.performance.title")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#19364d]">
              {t("feature.performance.description")}
            </p>
            <Link
              href="/contact"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-[#142d42] px-6 text-sm font-semibold text-white"
            >
              {t("hero.requestQuote")} <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="relative min-h-80 bg-[#10293d]">
            <Image
              src="/products/feritte-transformers.png"
              alt={t("home.hero3.title")}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-contain p-12 drop-shadow-2xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
