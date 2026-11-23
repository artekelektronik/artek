"use client";

import { useState, useTransition } from "react";
import { Button } from "@artek/ui/components/button";
import { cn } from "@artek/ui/lib/utils";
import { toastResult } from "@/components/form-status";
import { requestStatusLabels } from "@/lib/request-status";
import { setRequestStatusAction } from "./actions";

type Status = keyof typeof requestStatusLabels;
export type RequestRow = {
  id: string;
  name: string;
  contact: string;
  message: string;
  subject: string | null;
  productCode: string | null;
  pageUrl: string | null;
  locale: string;
  photoUrl: string | null;
  status: Status;
  statusBy: string | null;
  statusAt: string | null;
  createdAt: string;
};

const tones: Record<Status, string> = {
  yeni: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  yanitlandi: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  kapandi: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
};
const filters = [
  { key: "yeni", label: "Yeni" },
  { key: "tumu", label: "Tümü" },
] as const;

// An email address or a phone number, as the visitor typed it.
const contactHref = (contact: string) => (contact.includes("@") ? `mailto:${contact}` : `tel:${contact.replace(/[^\d+]/g, "")}`);

export function RequestsBoard({ rows, canEdit }: { rows: RequestRow[]; canEdit: boolean }) {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("yeni");
  const [pending, startTransition] = useTransition();
  const shown = filter === "yeni" ? rows.filter((r) => r.status === "yeni") : rows;
  const mark = (id: string, status: Status) => startTransition(async () => void toastResult(await setRequestStatusAction(id, status)));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"} onClick={() => setFilter(f.key)}>
            {f.label} ({f.key === "yeni" ? rows.filter((r) => r.status === "yeni").length : rows.length})
          </Button>
        ))}
      </div>
      {shown.length === 0 && <p className="rounded-lg border p-6 text-muted-foreground">{filter === "yeni" ? "Yanıt bekleyen talep yok." : "Henüz talep gelmedi."}</p>}
      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.id} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <b className="text-base">{r.name}</b>
              <a href={contactHref(r.contact)} className="underline underline-offset-4">
                {r.contact}
              </a>
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", tones[r.status])}>{requestStatusLabels[r.status]}</span>
              {r.locale === "en" && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200">İngilizce</span>}
              <span className="ml-auto text-sm text-muted-foreground">{r.createdAt}</span>
            </div>
            {r.subject && (
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">Konu:</span> {r.subject}
                {r.productCode && <> · Kod: <b>{r.productCode}</b></>}
              </p>
            )}
            <p className="mt-2 whitespace-pre-line break-words">{r.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {r.photoUrl && (
                <a href={r.photoUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  Fotoğrafı aç
                </a>
              )}
              {r.pageUrl && (
                <a href={r.pageUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                  Yazdığı sayfa
                </a>
              )}
              {r.statusAt && (
                <span className="text-muted-foreground">
                  {requestStatusLabels[r.status]}: {r.statusBy ?? "?"}, {r.statusAt}
                </span>
              )}
              {canEdit && (
                <span className="ml-auto flex gap-2">
                  {r.status === "yeni" ? (
                    <>
                      <Button size="sm" disabled={pending} onClick={() => mark(r.id, "yanitlandi")}>
                        Yanıtlandı
                      </Button>
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => mark(r.id, "kapandi")}>
                        Kapat
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => mark(r.id, "yeni")}>
                      Yeniden aç
                    </Button>
                  )}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
