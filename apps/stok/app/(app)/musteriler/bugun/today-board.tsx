"use client";

import { useState } from "react";
import { AlertTriangle, ChevronLeft, Hourglass, Lightbulb, Mail, MessageSquareReply, Phone, type LucideIcon } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { cn } from "@artek/ui/lib/utils";
import type { ReasonView } from "@/lib/close-reasons";
import {
  Age,
  ApprovalCard,
  CallCard,
  dayText,
  EmailCard,
  FailedCard,
  ProposalCard,
  ResultCard,
  type ProposalView,
  type ResultView,
  type SuggestionView,
} from "./suggestion-cards";

export type Entry =
  | { key: string; type: "suggestion"; s: SuggestionView }
  | { key: string; type: "result"; r: ResultView }
  | { key: string; type: "proposal"; p: ProposalView };
export type BoardSection = { title: string; entries: Entry[] };

// Every open item as one short row on the left; the picked one opens in full on the right (on narrower screens, in place of the list).
export function TodayBoard({
  sections,
  today,
  reasons,
  signature,
  canEdit,
}: {
  sections: BoardSection[];
  today: string;
  reasons: ReasonView[];
  signature: string;
  canEdit: boolean;
}) {
  const all = sections.flatMap((s) => s.entries);
  const [picked, setPicked] = useState<string | null>(null);
  const [detailOnPhone, setDetailOnPhone] = useState(false);
  // When the picked item is closed it leaves the list, and the first remaining one opens.
  const current = all.find((e) => e.key === picked) ?? all[0];
  if (!current) return null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:items-start">
      <nav aria-label="Bugünün işleri" className={cn("flex flex-col gap-4", detailOnPhone && "hidden xl:flex")}>
        {sections
          .filter((sec) => sec.entries.length > 0)
          .map((sec) => (
            <section key={sec.title} className="flex flex-col gap-1">
              <h2 className="text-muted-foreground px-1 text-xs font-medium">
                {sec.title} ({sec.entries.length})
              </h2>
              <ul className="bg-card divide-y overflow-hidden rounded-xl border">
                {sec.entries.map((e) => (
                  <li key={e.key}>
                    <button
                      type="button"
                      aria-current={e.key === current.key ? "true" : undefined}
                      onClick={() => {
                        setPicked(e.key);
                        setDetailOnPhone(true);
                      }}
                      className={cn(
                        "hover:bg-muted/60 flex w-full items-center gap-3 px-3 py-2.5 text-left",
                        e.key === current.key && "bg-muted xl:shadow-[inset_3px_0_0_var(--color-primary)]",
                      )}
                    >
                      <Row e={e} today={today} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </nav>

      <div className={cn("flex flex-col gap-2", !detailOnPhone && "hidden xl:flex")}>
        <Button type="button" variant="ghost" size="sm" className="self-start xl:hidden" onClick={() => setDetailOnPhone(false)}>
          <ChevronLeft /> Listeye dön
        </Button>
        <div key={current.key}>
          <Detail e={current} today={today} reasons={reasons} signature={signature} canEdit={canEdit} />
        </div>
      </div>
    </div>
  );
}

const tones = {
  arama: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  eposta: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  onay: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  hata: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  diger: "bg-muted text-muted-foreground",
};

function Row({ e, today }: { e: Entry; today: string }) {
  let Icon: LucideIcon;
  let tone: string;
  let name: string;
  let line: string;
  let badge: React.ReactNode = null;
  if (e.type === "suggestion") {
    const s = e.s;
    name = s.customer.name;
    badge = <Age s={s} today={today} />;
    if (s.status === "onay_bekliyor") [Icon, tone, line] = [Hourglass, tones.onay, `Onaylandı mı? ${s.waitingFor ?? ""}`];
    else if (s.status === "basarisiz") [Icon, tone, line] = [AlertTriangle, tones.hata, "Öneri hazırlanamadı"];
    else if (s.kind === "arama") [Icon, tone, line] = [Phone, tones.arama, s.reason];
    else [Icon, tone, line] = [Mail, tones.eposta, s.reason];
  } else if (e.type === "result") {
    const r = e.r;
    [Icon, tone, name] = [MessageSquareReply, tones.diger, r.customer.name];
    line = `${r.kind === "eposta" ? "E-posta" : "Arama"}${r.doneOn ? `, ${dayText(r.doneOn)}` : ""}${r.subject ? `: ${r.subject}` : ""}`;
    if (r.invoiceAfter)
      badge = <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-950 dark:text-green-200">Fatura geldi</span>;
  } else {
    [Icon, tone, name, line] = [Lightbulb, tones.diger, e.p.customer.name, `Not: ${e.p.closeNote ?? ""}`];
  }
  return (
    <>
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", tone)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="line-clamp-2 text-sm font-medium">{name}</span>
        <span className="text-muted-foreground truncate text-xs">{line}</span>
      </span>
      {badge && <span className="shrink-0">{badge}</span>}
    </>
  );
}

function Detail({ e, today, reasons, signature, canEdit }: { e: Entry; today: string; reasons: ReasonView[]; signature: string; canEdit: boolean }) {
  if (e.type === "result") return <ResultCard r={e.r} />;
  if (e.type === "proposal") return <ProposalCard p={e.p} />;
  const s = e.s;
  if (!canEdit) return <ReadOnly s={s} />;
  if (s.status === "onay_bekliyor") return <ApprovalCard s={s} today={today} reasons={reasons} />;
  if (s.status === "basarisiz") return <FailedCard s={s} today={today} reasons={reasons} />;
  return s.kind === "arama" ? <CallCard s={s} today={today} reasons={reasons} /> : <EmailCard s={s} signature={signature} today={today} reasons={reasons} />;
}

function ReadOnly({ s }: { s: SuggestionView }) {
  return (
    <article className="bg-card flex flex-col gap-2 rounded-xl border p-4 text-sm">
      <span className="font-medium">{s.customer.name}</span>
      <span className="text-muted-foreground">{s.reason}</span>
      {s.subject && <span>Konu: {s.subject}</span>}
    </article>
  );
}
