"use client";

import { useActionState, useState, useTransition } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { FormSelect } from "@/components/form-select";
import { FormStatus } from "@/components/form-status";
import { effectLabels, type CloseEffect, type ReasonView } from "@/lib/close-reasons";
import { archiveReasonAction, moveReasonAction, saveReasonAction } from "./actions";

const effectOptions = (Object.keys(effectLabels) as CloseEffect[]).map((value) => ({ value, label: effectLabels[value] }));

// Name, effect and, for "tekrar öner", after how many days. Without `r` it adds a new reason.
export function ReasonForm({ r }: { r?: ReasonView }) {
  const [state, action, pending] = useActionState(saveReasonAction, undefined);
  const [effect, setEffect] = useState<CloseEffect>(r?.effect ?? "not");
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={r?.id ?? ""} />
      <Input name="label" defaultValue={r?.label} placeholder="Sebep, örn. Tatilde" aria-label="Sebep" className="w-56" />
      <FormSelect
        name="effect"
        options={effectOptions}
        defaultValue={effect}
        aria-label="Etkisi"
        className="w-72"
        onValueChange={(v) => setEffect(v as CloseEffect)}
      />
      {effect === "tekrar" && (
        <label className="flex items-center gap-1 text-sm">
          <Input name="days" type="number" min={1} max={365} defaultValue={r?.days ?? 7} aria-label="Gün" className="w-20" /> gün sonra
        </label>
      )}
      <Button type="submit" size="sm" variant={r ? "outline" : "default"} disabled={pending}>
        {r ? "Kaydet" : "Ekle"}
      </Button>
      <FormStatus state={state} saved={r ? "Kaydedildi." : "Eklendi."} className="w-full" />
    </form>
  );
}

export function ReasonRow({ r, first, last }: { r: ReasonView; first: boolean; last: boolean }) {
  const [state, setState] = useState<{ error?: string } | undefined>();
  const [pending, start] = useTransition();
  return (
    <li className="bg-card flex flex-col gap-2 rounded-xl border p-3">
      <ReasonForm r={r} />
      <div className="flex flex-wrap items-center gap-1">
        <Button type="button" size="sm" variant="ghost" disabled={pending || first} onClick={() => start(async () => setState(await moveReasonAction(r.id, "up")))}>
          ↑ Yukarı
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending || last} onClick={() => start(async () => setState(await moveReasonAction(r.id, "down")))}>
          ↓ Aşağı
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="text-destructive"
          disabled={pending}
          onClick={() => {
            if (confirm(`“${r.label}” listeden kaldırılsın mı? Onunla kapatılmış öneriler etkilenmez.`)) start(async () => setState(await archiveReasonAction(r.id)));
          }}
        >
          Kaldır
        </Button>
        {state?.error && <span className="text-destructive text-xs">{state.error}</span>}
      </div>
    </li>
  );
}
