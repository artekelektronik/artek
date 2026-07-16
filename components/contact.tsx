"use client";

import { useTranslations } from "next-intl";
import Script from "next/script";
import { Clock3, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { cn } from "@/lib/utils";

interface Contact20Props {
  className?: string;
}

const Contact20 = ({ className }: Contact20Props) => {
  const t = useTranslations("contact");

  return (
    <section className={cn("bg-artek-porcelain pb-24 pt-14", className)}>
      <div className="bg-artek-navy px-6 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-artek-sky">{t("eyebrow")}</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">{t("heading")}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">{t("description")}</p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
            <Clock3 className="size-4 text-artek-electric" /> {t("responseTime")}
          </div>
        </div>
      </div>
      <div className="mx-auto -mt-8 max-w-6xl px-6">
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
                <a href="tel:+902122521168" className="hover:text-primary">
                  0212 252 11 68
                </a>
                <a href="tel:+905327183364" className="hover:text-primary block">
                  0532 718 33 64
                </a>
              </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="mt-1 size-5 shrink-0 text-artek-electric" />
              <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("emailLabel")}</p>
              <a
                href="mailto:artek@ferritnuve.com"
                className="text-lg font-semibold leading-snug hover:text-primary break-all"
              >
                artek@ferritnuve.com
              </a>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin className="mt-1 size-5 shrink-0 text-artek-electric" />
              <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("addressLabel")}</p>
              <a
                href="https://maps.google.com/?q=Ferrit%20N%C3%BCve%20Eri%C5%9Fteci%20Sokak%20Abed%20Han%20No%3A%207%2F1%20Karak%C3%B6y%20-%20%C4%B0stanbul"
                className="max-w-72 text-lg leading-snug font-semibold hover:text-primary"
              >
                Ferrit Nüve Erişteci Sokak Abed Han No : 7/1 Karaköy - İstanbul
              </a>
              </div>
            </div>
            </div>
            <a href="https://wa.me/905327183364" target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-artek-electric px-5 text-sm font-bold text-artek-ink transition hover:bg-artek-sky">
              <MessageCircle className="size-4" /> {t("whatsapp")}
            </a>
          </aside>
          <div className="p-6 sm:p-10">
            <h2 className="text-2xl font-semibold text-artek-ink">{t("formTitle")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t("formDescription")}</p>
            <div className="mt-6">
              <iframe
                data-tally-src="https://tally.so/embed/7RLMoL?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
                loading="lazy"
                width="100%"
                height="521"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                title="Bize Ulaşın"
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
