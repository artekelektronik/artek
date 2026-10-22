"use client";

import { useTranslations, useLocale } from "next-intl";
import Script from "next/script";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { company } from "@/lib/company";
import { inquiryLinks } from "@/lib/inquiry";
import { cn } from "@/lib/utils";

interface Contact20Props {
  className?: string;
  product?: {id:string; name:string; code?:string; url:string};
  invalidProduct?: boolean;
}

const Contact20 = ({ className, product, invalidProduct }: Contact20Props) => {
  const t = useTranslations("contact");
  const locale = useLocale();
  const links = product ? inquiryLinks(product.name, product.code, product.url, locale) : {email:`mailto:${company.email}`,whatsapp:`https://wa.me/${company.whatsapp}`};

  return (
    <section className={cn("bg-artek-porcelain pb-24 pt-14", className)}>
      <div className="bg-artek-navy px-6 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-artek-sky">{t("eyebrow")}</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">{t("heading")}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{t("description")}</p>

        </div>
      </div>
      <div className="mx-auto -mt-8 max-w-6xl px-6">
        {product && <section className="relative mb-6 rounded-xl border bg-white p-6"><h2 className="font-semibold">{t("selectedProduct")}</h2><p className="mt-2">{product.name}{product.code ? ` — ${product.code}` : ""}</p><a className="underline py-2 inline-block" href={product.url}>{t("viewProduct")}</a><p className="text-sm text-muted-foreground">{t("productFormNote")}</p></section>}
        {invalidProduct && <p role="status" className="relative mb-6 rounded-xl bg-white p-6">{t("invalidProduct")}</p>}
        <a href="#contact-form" className="relative mb-4 inline-flex rounded-lg bg-white px-4 py-3 underline lg:hidden">{t("skipToForm")}</a>
        <div className="grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(8,27,44,0.12)] lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="bg-artek-mist p-8 sm:p-10">
            <h2 className="text-2xl font-semibold text-artek-ink">{t("directTitle")}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t("directDescription")}</p>
            <div className="mt-8 space-y-6">
            <div className="flex gap-4">
              <Phone className="mt-1 size-5 shrink-0 text-artek-electric" />
              <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("phoneLabel")}</p>
              <div className="space-y-1 text-lg font-semibold leading-snug">
                <a href={company.phones[0].href} className="hover:text-primary">
                  {company.phones[0].label}
                </a>
                <a href={company.phones[1].href} className="hover:text-primary block">
                  {company.phones[1].label}
                </a>
              </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="mt-1 size-5 shrink-0 text-artek-electric" />
              <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("emailLabel")}</p>
              <a
                href={links.email}
                className="text-lg font-semibold leading-snug hover:text-primary break-all"
              >
                {company.email}
              </a>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin className="mt-1 size-5 shrink-0 text-artek-electric" />
              <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("addressLabel")}</p>
              <a
                href={company.map}
                className="max-w-72 text-lg leading-snug font-semibold hover:text-primary"
              >
                {company.address}
              </a>
              </div>
            </div>
            </div>
            <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-artek-electric px-5 text-sm font-bold text-artek-ink transition hover:bg-artek-sky">
              <MessageCircle className="size-4" /> {t("whatsapp")}
            </a>
          </aside>
          <div id="contact-form" className="min-w-0 scroll-mt-20 p-6 sm:p-10">
            <h2 className="text-2xl font-semibold text-artek-ink">{t("formTitle")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t("formDescription")}</p>
            <p className="mt-3 text-sm text-slate-600">{t("formFallback")}</p>
            {locale === "en" && <p className="mt-3 text-sm text-slate-600">{t("externalLanguage")}</p>}
            <div className="mt-6">
              <iframe
                src="https://tally.so/embed/7RLMoL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                loading="lazy"
                width="100%"
                height="521"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                title={t("formTitle")}
              />
              <Script
                src="https://tally.so/widgets/embed.js"
                strategy="lazyOnload"
                onLoad={() => {
                  if (typeof window !== "undefined" && "Tally" in window) {
                    (window as { Tally?: { loadEmbeds: () => void } }).Tally?.loadEmbeds();
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Contact20 };
