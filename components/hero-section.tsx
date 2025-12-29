"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

import { ImageIllustration } from "@/components/image-illustration";
import { Button } from "@/components/ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

export default function HeroSection() {
  const t = useTranslations("hero");

  return (
    <>
      <main role="main" className="overflow-hidden">
        <section>
          <div className="bg-muted pt-32 lg:pt-44">
            <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-12">
              <motion.div
                className="text-center"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                <motion.h1
                  variants={itemVariants}
                  className="text-foreground mx-auto text-balance text-5xl font-semibold lg:text-6xl xl:text-7xl xl:tracking-tight"
                >
                  {t("title")}
                </motion.h1>

                <motion.div
                  variants={itemVariants}
                  className="mx-auto mb-20 mt-4 max-w-lg"
                >
                  <p className="text-muted-foreground mb-6 text-balance text-lg lg:text-xl">
                    {t("subtitle")}
                  </p>

                  <div className="space-x-4 flex justify-center">
                    <Button asChild>
                      <Link href="/products">{t("viewDetails")}</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/contact">{t("requestQuote")}</Link>
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </div>
            <div>
              <ImageIllustration />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
