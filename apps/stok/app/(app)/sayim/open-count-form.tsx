"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Label } from "@artek/ui/components/label";
import type { CountKind } from "@/lib/counts";
import { FormSelect } from "@/components/form-select";
import { openCountAction } from "./actions";
import { FormStatus } from "@/components/form-status";

export function OpenCountForm({
  lokasyon,
  categories,
  kind,
}: {
  lokasyon: { id: string; name: string }[];
  categories: string[];
  kind: CountKind;
}) {
  const [state, formAction, pending] = useActionState(openCountAction, undefined);
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="kind" value={kind} />
      <Label className="flex-col items-stretch gap-1">
        Lokasyon
        <FormSelect name="lokasyonId" options={lokasyon.map((l) => ({ value: l.id, label: l.name }))} />
      </Label>
      {kind === "sayim" && (
        <Label className="flex-col items-stretch gap-1">
          Kapsam
          <FormSelect name="category" options={categories.map((c) => ({ value: c, label: c }))} empty="Tüm ürünler" />
        </Label>
      )}
      <Button type="submit" disabled={pending}>
        {kind === "acilis" ? "Açılış sayımını başlat" : "Sayım başlat"}
      </Button>
      <FormStatus state={state} className="w-full" />
    </form>
  );
}
