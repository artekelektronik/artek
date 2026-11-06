"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@artek/ui/lib/utils";
import { FormSelect } from "@/components/form-select";
import type { ActivityEntry } from "@/lib/activity";
import { activityEntityLabels as entityLabels } from "@/lib/labels";

export type ActivityRow = Omit<ActivityEntry, "at"> & { at: string };

const actionTones: Record<ActivityRow["action"], string> = {
  eklendi: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  duzenlendi: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  arsivlendi: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  geri_alindi: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  musteri_oldu: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  onaylandi: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  hareket: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  kullanici: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200",
};
const periods = { tumu: "Tüm zamanlar", bugun: "Bugün", hafta: "Son 7 gün" };
const href = (r: ActivityRow) => {
  if (r.entity === "musteri") return `/musteriler?secili=${r.entityId}`;
  if (r.entity === "aday") return `/musteriler/adaylar?secili=${r.entityId}`;
  if (r.entity === "fatura") return "/faturalar";
  if (r.entity === "kullanici") return `/kullanicilar/${r.entityId}`;
  return `/urunler/${r.entityId}`;
};
const timeText = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

export function ActivityList({ rows, todayStart, weekAgo }: { rows: ActivityRow[]; todayStart: string; weekAgo: string }) {
  const [entity, setEntity] = useState("tumu");
  const [who, setWho] = useState("herkes");
  const [period, setPeriod] = useState("tumu");
  const people = [...new Set(rows.map((r) => r.who))].sort((a, b) => a.localeCompare(b, "tr"));
  const inPeriod = (r: ActivityRow) => period === "tumu" || r.at >= (period === "hafta" ? weekAgo : todayStart);
  const shown = rows.filter((r) => (entity === "tumu" || r.entity === entity) && (who === "herkes" || r.who === who) && inPeriod(r));

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
        <FormSelect
          name="donem"
          options={Object.entries(periods).map(([value, label]) => ({ value, label }))}
          defaultValue="tumu"
          onValueChange={setPeriod}
          aria-label="Dönem"
          className="w-40"
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
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", actionTones[r.action])}>{r.actionLabel}</span>
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
