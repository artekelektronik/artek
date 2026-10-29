"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@artek/ui/lib/utils";
import { FormSelect } from "@/components/form-select";

type Entity = "fatura" | "musteri" | "aday";
type Action = "eklendi" | "duzenlendi" | "arsivlendi" | "geri_alindi" | "musteri_oldu";
export type ActivityRow = { id: string; entity: Entity; entityId: string; label: string; action: Action; detail: string | null; who: string; at: string };

const entityLabels: Record<Entity, string> = { fatura: "Fatura", musteri: "Müşteri", aday: "Aday" };
const actionLabels: Record<Action, string> = {
  eklendi: "Eklendi",
  duzenlendi: "Değişti",
  arsivlendi: "Arşivlendi",
  geri_alindi: "Geri alındı",
  musteri_oldu: "Müşteri oldu",
};
const actionTones: Record<Action, string> = {
  eklendi: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  duzenlendi: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  arsivlendi: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  geri_alindi: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  musteri_oldu: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
};
const href = (r: ActivityRow) =>
  r.entity === "musteri" ? `/musteriler?secili=${r.entityId}` : r.entity === "aday" ? `/musteriler/adaylar?secili=${r.entityId}` : "/faturalar";
const timeText = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

export function ActivityList({ rows }: { rows: ActivityRow[] }) {
  const [entity, setEntity] = useState("tumu");
  const [who, setWho] = useState("herkes");
  const people = [...new Set(rows.map((r) => r.who))].sort((a, b) => a.localeCompare(b, "tr"));
  const shown = rows.filter((r) => (entity === "tumu" || r.entity === entity) && (who === "herkes" || r.who === who));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <FormSelect
          name="tur"
          options={[{ value: "tumu", label: "Tüm kayıtlar" }, ...Object.entries(entityLabels).map(([value, label]) => ({ value, label }))]}
          defaultValue="tumu"
          onValueChange={setEntity}
          aria-label="Kayıt türü"
          className="w-40"
        />
        <FormSelect
          name="kim"
          options={[{ value: "herkes", label: "Herkes" }, ...people.map((p) => ({ value: p, label: p }))]}
          defaultValue="herkes"
          onValueChange={setWho}
          aria-label="Kim"
          className="w-48"
        />
        <span className="text-muted-foreground text-xs">{shown.length} işlem</span>
      </div>
      {shown.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">Henüz kayıtlı işlem yok.</p>
      ) : (
        <ul className="bg-card divide-y rounded-xl border">
          {shown.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground w-28 shrink-0 text-xs tabular-nums">{timeText(r.at)}</span>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", actionTones[r.action])}>{actionLabels[r.action]}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span>
                  <span className="text-muted-foreground">{entityLabels[r.entity]}:</span>{" "}
                  <Link href={href(r)} className="font-medium underline-offset-4 hover:underline">
                    {r.label}
                  </Link>
                </span>
                {r.detail && <span className="text-muted-foreground text-xs break-words">{r.detail}</span>}
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">{r.who}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
