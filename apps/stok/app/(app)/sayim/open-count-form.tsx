"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Label } from "@artek/ui/components/label";
import type { CountKind } from "@/lib/counts";
import { selectClassName } from "@/lib/ui";
import { openCountAction } from "./actions";

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
        <select name="lokasyonId" className={`${selectClassName} font-normal`} required>
          {lokasyon.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
      </Label>
      {kind === "sayim" && (
        <Label className="flex-col items-stretch gap-1">
          Kapsam
          <select name="category" className={`${selectClassName} font-normal`}>
            <option value="">Tüm ürünler</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Label>
      )}
      <Button type="submit" disabled={pending}>
        {kind === "acilis" ? "Açılış sayımını başlat" : "Sayım başlat"}
      </Button>
      {state?.error && (
        <p role="alert" className="text-destructive w-full text-sm">
          {state.error}
        </p>
      )}
    </form>
  );
}
