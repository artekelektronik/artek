"use client";

import { useTranslations } from "next-intl";
import { CornerDownRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Contact20Props {
  className?: string;
}

const Contact20 = ({ className }: Contact20Props) => {
  const t = useTranslations("contact");

  return (
    <section className={cn("py-32 mx-auto max-w-7xl", className)}>
      <div className="container">
        <div className="mt-20 flex flex-col justify-between gap-15 md:gap-10 lg:flex-row">
          <div className="flex w-full max-w-xs flex-col gap-5 lg:gap-12">
            <h1 className="text-5xl font-semibold tracking-tight lg:text-6xl">
              {t("heading")}
            </h1>
            <p className="text-sm text-foreground/50 uppercase">
              {t("description")}
            </p>
          </div>
          <div className="grid w-full gap-12 lg:grid-cols-3 lg:gap-2 lg:pl-10">
            <div>
              <p className="text-sm text-foreground/40 uppercase">
                {t("addressLabel")}
              </p>
              <p className="mt-1 max-w-50 text-lg leading-snug font-semibold">
                {t("address")}
              </p>
            </div>
            <div className="lg:col-span-2">
              <p className="text-sm text-foreground/40 uppercase">
                {t("phone")}
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">
                {t("email")}
              </p>
            </div>
            <form className="mt-10 grid grid-cols-2 gap-5 lg:col-span-3 lg:grid-cols-3">
              <Input
                type="text"
                placeholder={t("form.name")}
                className="mt-10 rounded-none border-0 border-b border-b-foreground/10 bg-transparent! p-0 uppercase shadow-none placeholder:text-foreground/20 focus-visible:ring-0 lg:text-base"
              />
              <Input
                type="text"
                placeholder={t("form.email")}
                className="mt-10 rounded-none border-0 border-b border-b-foreground/10 bg-transparent! p-0 uppercase shadow-none placeholder:text-foreground/20 focus-visible:ring-0 lg:text-base"
              />
              <Input
                type="text"
                placeholder={t("form.phone")}
                className="mt-10 rounded-none border-0 border-b border-b-foreground/10 bg-transparent! p-0 uppercase shadow-none placeholder:text-foreground/20 focus-visible:ring-0 lg:text-base"
              />
              <Select>
                <SelectTrigger className="mt-10 w-full rounded-none border-0 border-b border-b-foreground/10 bg-transparent! p-0 uppercase shadow-none focus-visible:ring-0 data-placeholder:text-foreground/20 lg:text-base">
                  <SelectValue
                    placeholder={t("form.service")}
                    className="text-foreground/20"
                  />
                </SelectTrigger>
                <SelectContent className="rounded-none uppercase shadow-none">
                  <SelectItem className="rounded-none py-4" value="general">
                    {t("form.services.general")}
                  </SelectItem>
                  <SelectItem className="rounded-none py-4" value="ferriteCore">
                    {t("form.services.ferriteCore")}
                  </SelectItem>
                  <SelectItem
                    className="rounded-none py-4"
                    value="transformers"
                  >
                    {t("form.services.transformers")}
                  </SelectItem>
                  <SelectItem className="rounded-none py-4" value="partnership">
                    {t("form.services.partnership")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Textarea
                placeholder={t("form.message")}
                className="col-span-2 mt-10 min-h-42 rounded-none border-0 border-b border-b-foreground/10 bg-transparent! p-0 uppercase shadow-none placeholder:text-foreground/20 focus-visible:ring-0 lg:col-span-3 lg:text-base"
              />
              <Button variant="ghost" className="w-fit rounded-none uppercase">
                <CornerDownRight className="size-5" />
                {t("form.submit")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export { Contact20 };
