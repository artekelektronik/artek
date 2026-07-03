"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Cable,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { productCatalogPaths } from "@/lib/product-taxonomy";

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const quickLinks = [
  { key: "cores", href: productCatalogPaths.ferrit, icon: Boxes },
  { key: "bobbins", href: productCatalogPaths.pem, icon: Cable },
  { key: "transformers", href: "/transformator", icon: Zap },
  { key: "custom", href: "/contact", icon: Sparkles },
] as const;

export default function HeroSection() {
  const t = useTranslations("hero");

  const openSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true })
    );
  };

  return (
    <main className="overflow-hidden bg-[#f4f6f8] pt-14">
      <section className="bg-[#142d42] pb-16 pt-12 text-white lg:pb-24 lg:pt-16">
        <motion.div
          className="mx-auto max-w-6xl px-6"
          initial="hidden"
          animate="visible"
          transition={{ staggerChildren: 0.1 }}
        >
          <motion.div
            variants={itemVariants}
            className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
          >
            <div className="max-w-3xl">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                <BadgeCheck className="size-4" />
                {t("eyebrow")}
              </p>
              <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
                {t("title")}
              </h1>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-300 lg:text-right">
              {t("subtitle")}
            </p>
          </motion.div>

          <motion.button
            variants={itemVariants}
            type="button"
            onClick={openSearch}
            className="group flex w-full cursor-pointer items-center rounded-2xl bg-white p-2 text-left shadow-[0_18px_50px_rgba(3,14,25,0.24)] transition hover:-translate-y-0.5"
            aria-label={t("searchPlaceholder")}
          >
            <span className="flex flex-1 items-center gap-3 px-4 text-base text-slate-500 sm:px-6 sm:text-lg">
              <Search className="size-5 text-slate-400" />
              {t("searchPlaceholder")}
            </span>
            <span className="grid size-12 place-items-center rounded-xl bg-emerald-500 text-white transition group-hover:bg-emerald-400 sm:size-14">
              <ArrowRight className="size-5" />
            </span>
          </motion.button>
        </motion.div>
      </section>

      <section className="mx-auto -mt-10 max-w-6xl px-4 pb-16 sm:px-6 lg:-mt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.55 }}
          className="relative isolate grid min-h-[430px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,35,50,0.12)] lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="relative z-10 flex flex-col items-start justify-center p-8 sm:p-12 lg:p-16">
            <span className="mb-7 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
              {t("announcement")}
            </span>
            <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {t("featureTitle")}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              {t("featureDescription")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={productCatalogPaths.all}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[#142d42] px-6 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {t("viewDetails")}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center rounded-full border border-slate-300 px-6 text-sm font-semibold text-slate-800 transition hover:border-slate-800"
              >
                {t("requestQuote")}
              </Link>
            </div>
          </div>

          <div className="relative min-h-[320px] overflow-hidden bg-[radial-gradient(circle_at_65%_45%,#d1fae5_0,transparent_42%),linear-gradient(145deg,#f8fafc,#e8eef2)] lg:min-h-full">
            <div className="absolute -right-20 -top-20 size-64 rounded-full border border-emerald-300/50" />
            <div className="absolute -bottom-24 -left-12 size-72 rounded-full border border-slate-300" />
            <Image
              src="/products/core.png"
              alt={t("featureImageAlt")}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-contain p-12 drop-shadow-[0_28px_30px_rgba(15,35,50,0.28)] sm:p-16 lg:p-20"
            />
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 p-4 shadow-lg backdrop-blur">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t("madeIn")}
                </p>
                <p className="mt-1 text-sm font-bold text-slate-900">{t("since")}</p>
              </div>
              <ShieldCheck className="size-8 text-emerald-600" />
            </div>
          </div>
        </motion.div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ key, href, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-[#142d42] transition group-hover:bg-emerald-500 group-hover:text-white">
                <Icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  {t(`quickLinks.${key}`)}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {t("quickLinks.explore")}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
