"use client";

import { ArrowRight, Factory, Zap, Target, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

interface About1Props {
  className?: string;
}

const About = ({ className }: About1Props) => {
  const t = useTranslations("about");

  return (
    <section className={cn("py-32", className)}>
      <div className="mx-auto max-w-6xl px-6 flex flex-col gap-16 lg:gap-28">
        <div className="flex flex-col gap-4 lg:gap-8">
          <h1 className="text-4xl font-semibold tracking-tighter lg:text-7xl">
            {t("mainHeading").split(":").map((part, index) => (
              <span key={index}>
                {part}
                {index === 0 && <br />}
              </span>
            ))}
          </h1>
          <p className="max-w-xl text-xl">
            {t("intro")}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <img
            src="https://images.unsplash.com/photo-1716643863806-989dd76ae093?q=80&w=2274&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt={t("imageAlt")}
            className="size-full max-h-96 rounded-2xl object-cover"
          />
          <div className="flex flex-col justify-between gap-10 rounded-2xl bg-black bg-cover bg-center p-10 relative overflow-hidden" style={{backgroundImage: "url('https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')"}}>
            <div className="absolute inset-0 bg-black/40 rounded-2xl"></div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-white">
                {t("manufacturingStrength.heading").toUpperCase()}
              </p>
              <p className="text-lg font-medium text-white mt-36">
                {t("manufacturingStrength.content")}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 md:gap-20">
          <div className="max-w-xl">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-5xl">
              {t("expertise.heading")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("expertise.intro")}
            </p>
          </div>
          <div className="grid gap-10 md:grid-cols-4">
            <div className="flex flex-col">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent">
                <Award className="size-5" />
              </div>
              <h3 className="mt-2 mb-3 text-lg font-semibold">
                {t("expertise.automotive").split(":")[0]}
              </h3>
              <p className="text-muted-foreground">
                {t("expertise.automotive").split(":")[1]}
              </p>
            </div>
            <div className="flex flex-col">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent">
                <Zap className="size-5" />
              </div>
              <h3 className="mt-2 mb-3 text-lg font-semibold">
                {t("expertise.lighting").split(":")[0]}
              </h3>
              <p className="text-muted-foreground">
                {t("expertise.lighting").split(":")[1]}
              </p>
            </div>
            <div className="flex flex-col">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent">
                <Factory className="size-5" />
              </div>
              <h3 className="mt-2 mb-3 text-lg font-semibold">
                {t("expertise.medical").split(":")[0]}
              </h3>
              <p className="text-muted-foreground">
                {t("expertise.medical").split(":")[1]}
              </p>
            </div>
            <div className="flex flex-col">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent">
                <Target className="size-5" />
              </div>
              <h3 className="mt-2 mb-3 text-lg font-semibold">
                {t("expertise.agriculture").split(":")[0]}
              </h3>
              <p className="text-muted-foreground">
                {t("expertise.agriculture").split(":")[1]}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-6 md:gap-10 bg-muted rounded-2xl p-10">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-5xl">
                {t("vision.heading")}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {t("vision.content")}
              </p>
              <p className="text-xl font-semibold">
                {t("vision.closing")}
              </p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1655393001768-d946c97d6fd1?q=80&w=2676&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt={t("imageAlt")}
              className="rounded-2xl object-cover w-full h-96"
            />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-artek-navy p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">{t("cta.title")}</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">{t("cta.description")}</p>
          </div>
          <Link href="/contact" className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-artek-electric px-6 text-sm font-bold text-artek-ink transition hover:bg-artek-sky">
            {t("cta.button")} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export { About };
