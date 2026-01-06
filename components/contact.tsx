"use client";

import { useTranslations } from "next-intl";
import Script from "next/script";

import { cn } from "@/lib/utils";

interface Contact20Props {
  className?: string;
}

const Contact20 = ({ className }: Contact20Props) => {
  const t = useTranslations("contact");

  return (
    <section className={cn("py-32", className)}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-15 md:gap-10 lg:flex-row">
          <div className="flex w-full max-w-xs flex-col gap-5 lg:gap-12">
            <h1 className="text-5xl font-semibold tracking-tight lg:text-6xl">
              {t("heading")}
            </h1>
            <p className="text-sm text-foreground/50 uppercase">
              {t("description")}
            </p>
          </div>
          <div className="grid w-full gap-8 lg:grid-cols-3 lg:gap-6 lg:pl-10">
            <div className="space-y-2">
              <p className="text-sm text-foreground/40 uppercase">Telefon</p>
              <div className="space-y-1 text-lg font-semibold leading-snug">
                <a href="tel:+902122521168" className="hover:text-primary">
                  0212 252 11 68
                </a>
                <a href="tel:+905327183364" className="hover:text-primary block">
                  0532 718 33 64
                </a>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-foreground/40 uppercase">Email</p>
              <a
                href="mailto:artek@ferritnuve.com"
                className="text-lg font-semibold leading-snug hover:text-primary break-all"
              >
                artek@ferritnuve.com
              </a>
            </div>
            <div className="space-y-2 lg:col-span-1">
              <p className="text-sm text-foreground/40 uppercase">Adres</p>
              <a
                href="https://maps.google.com/?q=Ferrit%20N%C3%BCve%20Eri%C5%9Fteci%20Sokak%20Abed%20Han%20No%3A%207%2F1%20Karak%C3%B6y%20-%20%C4%B0stanbul"
                className="max-w-72 text-lg leading-snug font-semibold hover:text-primary"
              >
                Ferrit Nüve Erişteci Sokak Abed Han No : 7/1 Karaköy - İstanbul
              </a>
            </div>

            {/* Tally embedded form */}
            <div className="mt-10 lg:col-span-3">
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
