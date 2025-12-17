"use client";

import { useTranslations } from "next-intl";
import { Blocks, BookOpen, Palette, Zap } from "lucide-react";

const Feature = () => {
  const t = useTranslations("feature");

  const features = [
    {
      id: "feature-1",
      title: t("certified.title"),
      description: t("certified.description"),
      icon: <BookOpen className="size-10" strokeWidth={1.5} />,
    },
    {
      id: "feature-2",
      title: t("performance.title"),
      description: t("performance.description"),
      icon: <Zap className="size-10" strokeWidth={1.5} />,
    },
    {
      id: "feature-3",
      title: t("leading.title"),
      description: t("leading.description"),
      icon: <Blocks className="size-10" strokeWidth={1.5} />,
    },
    {
      id: "feature-4",
      title: t("support.title"),
      description: t("support.description"),
      icon: <Palette className="size-10" strokeWidth={1.5} />,
    },
  ];

  return (
    <section className="relative pt-32 px-4">
      <div className="w-full relative z-10 flex flex-col space-y-14">
        <h2 className="text-3xl font-semibold md:mb-4 md:text-5xl lg:mb-6 lg:max-w-xl">
          {t("title")}
        </h2>
        <p className="text-xl font-thin text-muted-foreground">
          {t("subtitle")}
        </p>
        <div className="relative mt-6 md:mt-10">
          <div className="bg-border absolute left-0 right-0 top-0 h-px" />
          <div className="divide-border grid md:grid-cols-4 md:divide-x">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="relative px-6 pb-20 md:pb-10 lg:px-10"
              >
                <div className="bg-border absolute left-0 right-0 top-0 h-px md:hidden" />
                <div className="bg-background relative -mt-6 mb-10 flex aspect-square w-12 items-center justify-center md:-mt-10 md:mb-10 md:w-20">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="mb-3 max-w-48 text-lg font-semibold md:mb-4 md:text-2xl lg:mb-6">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-border absolute bottom-0 left-0 right-0 h-px" />
        </div>
      </div>
      <div className="w-full absolute inset-0 hidden h-full md:block">
        <div className="relative h-full">
        </div>
      </div>
    </section>
  );
};

export { Feature };
