"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface CertificatesProps {
  className?: string;
}

import { certificates as CERTIFICATES } from "@/lib/certificates";

const Certificates = ({ className }: CertificatesProps) => {
  const t = useTranslations("certificates");

  return (
    <section className={cn("py-32", className)}>
      <div className="mx-auto max-w-6xl px-6 flex flex-col gap-16 lg:gap-28">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:gap-8">
          <h1 className="text-4xl font-semibold tracking-tighter lg:text-7xl">
            {t("title")}
          </h1>
          <p className="max-w-xl text-xl text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        <p className="rounded-lg border p-5 text-muted-foreground">{t("archiveNote")}</p>
        {/* Certificates Grid with Images */}
        <div className="grid gap-8 md:grid-cols-3">
          {CERTIFICATES.map((cert) => {
            return (
              <div
                key={cert.id}
                className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-8 hover:shadow-lg transition-shadow"
              >
                {/* Certificate Image */}
                <div className="relative w-full h-auto rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <img
                    src={cert.image}
                    alt={cert.name}
                    width={400}
                    height={400}
                    className="w-full h-auto object-contain"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col gap-2">
                  <h3 className="text-2xl font-semibold">{cert.name}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t(`certificates.${cert.id}.description`)}
                  </p>
                </div>

                {/* View PDF Button */}
                <a
                  href={`/certificates/${encodeURIComponent(cert.file)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {t("viewCertificate")} — {cert.name} (PDF)
                </a>
                <a href={`/certificates/${encodeURIComponent(cert.file)}`} download className="underline py-2 text-sm">{t("downloadPDF")} — {cert.name}</a>
              </div>
            );
          })}
        </div>

        {/* Commitment Section */}
        <div className="flex flex-col gap-6 md:gap-10 bg-muted rounded-2xl p-10">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="mb-4 text-3xl font-semibold tracking-tight md:text-5xl">
                {t("commitment")}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {t("commitmentDesc")}
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 flex-shrink-0 mt-1 text-primary" />
                  <span className="text-muted-foreground">{t("commitmentItem1")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 flex-shrink-0 mt-1 text-primary" />
                  <span className="text-muted-foreground">{t("commitmentItem2")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 flex-shrink-0 mt-1 text-primary" />
                  <span className="text-muted-foreground">{t("commitmentItem3")}</span>
                </li>
              </ul>
            </div>
            <img
              src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt={t("imageAlt")}
              className="rounded-2xl object-cover w-full h-96"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export { Certificates };
