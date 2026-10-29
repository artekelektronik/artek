"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Globe, Lightbulb, ListChecks, PenLine, type LucideIcon } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Textarea } from "@artek/ui/components/textarea";
import { cn } from "@artek/ui/lib/utils";
import { DatePicker } from "@/components/date-picker";
import { FormSelect } from "@/components/form-select";
import { FormStatus } from "@/components/form-status";
import { describeEffect, type ReasonView } from "@/lib/close-reasons";
import { maxResultReasks, outcomeLabels, type Outcome } from "@/lib/outcomes";
import { addDays } from "@/lib/time";
import {
  acceptProposalAction,
  approvalArrivedAction,
  askResultLaterAction,
  closeUndoneAction,
  completeCallAction,
  postponeAction,
  recordResultAction,
  rejectProposalAction,
  sendEmailAction,
  waitForApprovalAction,
} from "./actions";

export type SuggestionView = {
  id: string;
  kind: "arama" | "eposta";
  status: "bekliyor" | "gonderildi" | "yapildi" | "atlandi" | "basarisiz" | "yapilamadi" | "ertelendi" | "onay_bekliyor";
  forDay: string;
  scheduled: boolean;
  waitingFor: string | null;
  askAgainOn: string | null;
  reason: string;
  talkingPoints: string[];
  subject: string | null;
  body: string | null;
  findings: { title: string; url: string; summary: string }[];
  error: string | null;
  customer: { id: string; name: string; city: string; phone: string | null; email: string | null };
};

// Each part of a suggestion in its own tinted box with a heading, so the eye finds it at a glance.
const blockTones = {
  neden: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 [&>h3]:text-amber-800 dark:[&>h3]:text-amber-300",
  bulgu: "border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40 [&>h3]:text-sky-800 dark:[&>h3]:text-sky-300",
  sorular: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/40 [&>h3]:text-green-800 dark:[&>h3]:text-green-300",
};

function Block({ tone, icon: Icon, title, children }: { tone: keyof typeof blockTones; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className={cn("flex flex-col gap-2 rounded-lg border p-3", blockTones[tone])}>
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
        <Icon className="size-4" aria-hidden />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Reason({ s }: { s: SuggestionView }) {
  return (
    <Block tone="neden" icon={Lightbulb} title="Neden bu müşteri">
      <p className="text-sm leading-relaxed">{s.reason}</p>
    </Block>
  );
}

function Findings({ items }: { items: SuggestionView["findings"] }) {
  return (
    <Block tone="bulgu" icon={Globe} title={`İnternette bulunanlar${items.length ? ` (${items.length})` : ""}`}>
      {items.length ? (
        <ul className="flex flex-col gap-2.5">
          {items.map((f) => (
            <li key={f.url} className="flex flex-col gap-0.5 text-sm">
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
                {f.title}
              </a>
              <span className="text-muted-foreground leading-relaxed">{f.summary}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">İnternette yeni bir şey bulunamadı; geçmişimize göre hazırlandı.</p>
      )}
    </Block>
  );
}

function TalkingPoints({ items, title }: { items: string[]; title: string }) {
  if (!items.length) return null;
  return (
    <Block tone="sorular" icon={ListChecks} title={title}>
      <ul className="list-disc pl-5 text-sm leading-relaxed">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </Block>
  );
}

const quickDays = [
  { label: "3 gün", days: 3 },
  { label: "1 hafta", days: 7 },
  { label: "2 hafta", days: 14 },
];

// The other ways to close a suggestion besides doing it; each needs its reason, day or what we wait for.
function CloseOptions({ id, today, reasons }: { id: string; today: string; reasons: ReasonView[] }) {
  const [mode, setMode] = useState<"yapilamadi" | "ertele" | "onay" | null>(null);
  const [undone, undoneAction, undonePending] = useActionState(closeUndoneAction, undefined);
  const [later, laterAction, laterPending] = useActionState(postponeAction, undefined);
  const [wait, waitAction, waitPending] = useActionState(waitForApprovalAction, undefined);
  const choices = [
    { key: "yapilamadi", label: "Yapılamadı" },
    { key: "ertele", label: "Sonraya bırak" },
    { key: "onay", label: "Onay bekliyor" },
  ] as const;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {choices.map((c) => (
          <Button key={c.key} type="button" size="sm" variant={mode === c.key ? "secondary" : "ghost"} onClick={() => setMode(mode === c.key ? null : c.key)}>
            {c.label}
          </Button>
        ))}
      </div>
      {mode === "yapilamadi" && (
        <form action={undoneAction} className="flex flex-col gap-2 rounded-lg border p-3">
          <input type="hidden" name="id" value={id} />
          <FormSelect name="reason" options={reasons.map((r) => ({ value: r.id, label: r.label }))} empty="Sebep seçin" aria-label="Sebep" />
          <Textarea name="note" rows={2} placeholder="Ne oldu? (isteğe bağlı; “Diğer” için gerekli)" aria-label="Not" />
          <p className="text-muted-foreground text-xs">Not yazarsanız asistan okur ve ne yapılacağını önerir; siz onaylamadan bir şey değişmez.</p>
          <div>
            <Button type="submit" size="sm" disabled={undonePending}>
              Kaydet ve kapat
            </Button>
          </div>
          <FormStatus state={undone} />
        </form>
      )}
      {mode === "ertele" && (
        <form action={laterAction} className="flex flex-col gap-2 rounded-lg border p-3">
          <input type="hidden" name="id" value={id} />
          <div className="flex flex-wrap items-center gap-2">
            {quickDays.map((q) => (
              <Button key={q.days} type="submit" size="sm" variant="outline" name="quick" value={addDays(today, q.days)} disabled={laterPending}>
                {q.label}
              </Button>
            ))}
            <span className="text-muted-foreground text-xs">ya da</span>
            <DatePicker id={`ertele-${id}`} name="until" />
            <Button type="submit" size="sm" disabled={laterPending}>
              Bu güne bırak
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">O sabah asistan bu müşteri için yeniden hazırlık yapar.</p>
          <FormStatus state={later} />
        </form>
      )}
      {mode === "onay" && (
        <form action={waitAction} className="flex flex-col gap-2 rounded-lg border p-3">
          <input type="hidden" name="id" value={id} />
          <Input name="waitingFor" placeholder="Neyi bekliyoruz? Örn. patronun fiyat onayı" aria-label="Neyi bekliyoruz?" />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" disabled={waitPending}>
              Kaydet
            </Button>
            <span className="text-muted-foreground text-xs">3 günde bir “Onaylandı mı?” diye burada sorulur.</span>
          </div>
          <FormStatus state={wait} />
        </form>
      )}
    </div>
  );
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

// On a suggestion from an earlier day: a late Takip in red, anything else in grey.
export function Age({ s, today }: { s: SuggestionView; today: string }) {
  const days = daysBetween(s.forDay, today);
  if (days <= 0) return null;
  return s.scheduled ? (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">{days} gün gecikti</span>
  ) : (
    <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">{days} gün önce hazırlandı</span>
  );
}

function Head({ s, today }: { s: SuggestionView; today: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link href={`/musteriler?secili=${s.customer.id}`} className="font-medium underline-offset-4 hover:underline">
          {s.customer.name}
        </Link>
        <span className="flex items-center gap-2">
          <Age s={s} today={today} />
          <span className="text-muted-foreground text-xs">{s.customer.city}</span>
        </span>
      </div>
    </div>
  );
}

export function CallCard({ s, today, reasons }: { s: SuggestionView; today: string; reasons: ReasonView[] }) {
  const [state, action, pending] = useActionState(completeCallAction, undefined);
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <Head s={s} today={today} />
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground text-xs">Telefon</span>
        <span className="font-medium tabular-nums">{s.customer.phone ?? "Kartta yok"}</span>
      </div>
      <Reason s={s} />
      <TalkingPoints items={s.talkingPoints} title="Aramada sorabilecekleriniz" />
      <Findings items={s.findings} />
      <form action={action} className="flex flex-col gap-2 border-t pt-3">
        <input type="hidden" name="id" value={s.id} />
        <Label className="flex-col items-stretch gap-1 font-normal">
          Görüşme notu
          <Textarea name="note" rows={2} placeholder="Ne konuştunuz, ne istediler?" />
        </Label>
        <div className="flex flex-wrap items-end gap-2">
          <Label className="flex-col items-start gap-1 text-xs font-normal">
            Arandığı gün (boşsa bugün)
            <DatePicker id={`arandi-${s.id}`} name="calledOn" />
          </Label>
          <Label className="flex-col items-start gap-1 text-xs font-normal">
            Sonraki takip
            <DatePicker id={`takip-${s.id}`} name="nextFollowUpOn" />
          </Label>
          <Button type="submit" disabled={pending}>
            Arandı, kaydet
          </Button>
        </div>
        <FormStatus state={state} saved="Kaydedildi." />
      </form>
      <CloseOptions id={s.id} today={today} reasons={reasons} />
    </article>
  );
}

export function EmailCard({ s, signature, today, reasons }: { s: SuggestionView; signature: string; today: string; reasons: ReasonView[] }) {
  const [state, action, pending] = useActionState(sendEmailAction, undefined);
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <Head s={s} today={today} />
      <Reason s={s} />
      <Findings items={s.findings} />
      <TalkingPoints items={s.talkingPoints} title="Cevap gelirse konuşulacaklar" />
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={s.id} />
        <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <PenLine className="size-4" aria-hidden />
          E-posta taslağı
        </h3>
        <p className="text-muted-foreground text-xs">
          Kime: <span className="text-foreground">{s.customer.email}</span> · Gönderen: artek@ferritnuve.com
        </p>
        <Input name="subject" defaultValue={s.subject ?? ""} aria-label="Konu" className="font-medium" />
        <Textarea name="body" defaultValue={s.body ?? ""} rows={8} aria-label="E-posta metni" />
        <pre className="text-muted-foreground font-sans text-xs whitespace-pre-wrap">{signature}</pre>
        <div className="flex flex-wrap items-end gap-2">
          <Label className="flex-col items-start gap-1 text-xs font-normal">
            Sonraki takip
            <DatePicker id={`takip-${s.id}`} name="nextFollowUpOn" />
          </Label>
          <Button type="submit" disabled={pending}>
            {pending ? "Gönderiliyor…" : "Gönder"}
          </Button>
        </div>
        <FormStatus state={state} saved="Gönderildi; müşterinin kartına not düşüldü." />
      </form>
      <CloseOptions id={s.id} today={today} reasons={reasons} />
    </article>
  );
}

export function FailedCard({ s, today, reasons }: { s: SuggestionView; today: string; reasons: ReasonView[] }) {
  return (
    <article className="bg-card flex flex-col gap-2 rounded-xl border border-dashed p-4">
      <Head s={s} today={today} />
      <p className="text-muted-foreground text-sm">{s.reason}</p>
      <p className="text-destructive text-xs">Öneri hazırlanamadı: {s.error}</p>
      <CloseOptions id={s.id} today={today} reasons={reasons} />
    </article>
  );
}

// Back from "Onay bekliyor": either it came, and the suggestion opens again, or we keep waiting.
export function ApprovalCard({ s, today, reasons }: { s: SuggestionView; today: string; reasons: ReasonView[] }) {
  const [state, setState] = useState<{ error?: string } | undefined>();
  const [pending, start] = useTransition();
  const [waiting, waitAction, waitPending] = useActionState(waitForApprovalAction, undefined);
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border border-amber-300 p-4 dark:border-amber-800">
      <Head s={s} today={today} />
      <Reason s={s} />
      <p className="text-sm">
        <b>Onaylandı mı?</b> Beklenen: {s.waitingFor}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={pending} onClick={() => start(async () => setState(await approvalArrivedAction(s.id)))}>
          Onaylandı, şimdi yapacağım
        </Button>
        <form action={waitAction}>
          <input type="hidden" name="id" value={s.id} />
          <input type="hidden" name="waitingFor" value={s.waitingFor ?? ""} />
          <Button type="submit" variant="outline" disabled={waitPending}>
            Hâlâ bekliyor, 3 gün sonra sor
          </Button>
        </form>
        {state?.error && <span className="text-destructive text-xs">{state.error}</span>}
      </div>
      <FormStatus state={waiting} />
      <CloseOptions id={s.id} today={today} reasons={reasons} />
    </article>
  );
}

export function PrepareButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setMessage("Hazırlanıyor; her müşteri için siteye ve haberlere bakıyor, birkaç dakika sürebilir…");
          try {
            const response = await fetch("/api/asistan", { method: "POST" });
            const json = await response.json();
            setMessage(
              !response.ok
                ? json.error
                : json.open
                  ? `${json.prepared ? `${json.prepared} takip hazırlandı. ` : ""}Kapatılmamış ${json.open} öneri var; onları kapatınca asistan yeni müşteri seçer.`
                  : `${json.prepared} öneri hazır${json.failed ? `, ${json.failed} hazırlanamadı` : ""}.`,
            );
          } catch {
            setMessage("Bağlantı koptu; birazdan tekrar deneyin.");
          }
          setBusy(false);
          router.refresh();
        }}
      >
        Daha fazla öneri hazırla
      </Button>
      {message && <span className="text-muted-foreground text-xs">{message}</span>}
    </div>
  );
}

export type ProposalView = {
  id: string;
  customer: { id: string; name: string };
  closeNote: string | null;
  proposal: { effect: ReasonView["effect"]; days: number | null; newName: string | null; explanation: string };
};

// What the assistant made of a free note; nothing changes until someone presses Uygula.
export function ProposalCard({ p }: { p: ProposalView }) {
  const [state, setState] = useState<{ error?: string } | undefined>();
  const [pending, start] = useTransition();
  return (
    <article className="bg-card flex flex-col gap-2 rounded-xl border p-4 text-sm">
      <Link href={`/musteriler?secili=${p.customer.id}`} className="font-medium underline-offset-4 hover:underline">
        {p.customer.name}
      </Link>
      <p className="text-muted-foreground">Not: “{p.closeNote}”</p>
      <p>
        <b>Öneri:</b> {p.proposal.effect !== "not" && describeEffect(p.proposal)}
        {p.proposal.effect !== "not" && p.proposal.newName && " · "}
        {p.proposal.newName && <>Yeni unvanı kaydet: {p.proposal.newName}</>}
      </p>
      <p className="text-muted-foreground text-xs">{p.proposal.explanation}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={() => start(async () => setState(await acceptProposalAction(p.id)))}>
          Uygula
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => setState(await rejectProposalAction(p.id)))}>
          Reddet
        </Button>
        {state?.error && <span className="text-destructive text-xs">{state.error}</span>}
      </div>
    </article>
  );
}

export type ResultView = {
  id: string;
  kind: "arama" | "eposta";
  doneOn: string | null;
  subject: string | null;
  resultAsks: number;
  customer: { id: string; name: string; city: string };
  invoiceAfter: { number: string; issuedOn: string } | null;
};

const answers = (Object.keys(outcomeLabels) as Outcome[]).filter((o) => o !== "girilmedi");
export const dayText = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" });

// A few working days after an email or call: what came of it. It doesn't hold up new suggestions.
export function ResultCard({ r }: { r: ResultView }) {
  const [outcome, setOutcome] = useState<Outcome | null>(r.invoiceAfter ? "siparis" : null);
  const [state, action, pending] = useActionState(recordResultAction, undefined);
  const [later, setLater] = useState<{ error?: string } | undefined>();
  const [laterPending, start] = useTransition();
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link href={`/musteriler?secili=${r.customer.id}`} className="font-medium underline-offset-4 hover:underline">
          {r.customer.name}
        </Link>
        <span className="text-muted-foreground text-xs">{r.customer.city}</span>
      </div>
      <p className="text-muted-foreground">
        {r.kind === "eposta" ? "E-posta gönderildi" : "Arandı"}
        {r.doneOn && `, ${dayText(r.doneOn)}`}
        {r.subject && `: ${r.subject}`}
      </p>
      {r.invoiceAfter && (
        <p className="rounded-lg bg-green-50 p-2 text-green-900 dark:bg-green-950 dark:text-green-100">
          Bu temastan sonra fatura geldi: {r.invoiceAfter.number}, {dayText(r.invoiceAfter.issuedOn)}.
        </p>
      )}
      <form action={action} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={r.id} />
        <input type="hidden" name="outcome" value={outcome ?? ""} />
        <div className="flex flex-wrap gap-1">
          {answers.map((o) => (
            <Button key={o} type="button" size="sm" variant={outcome === o ? "default" : "outline"} onClick={() => setOutcome(o)}>
              {outcomeLabels[o]}
            </Button>
          ))}
        </div>
        {outcome === "cevap_yok" && (
          <div className="flex flex-wrap items-end gap-2">
            <Label className="flex-col items-start gap-1 text-xs font-normal">
              Tekrar ne zaman denensin? (isteğe bağlı)
              <DatePicker id={`tekrar-${r.id}`} name="nextFollowUpOn" />
            </Label>
            <FormSelect
              name="followUpChannel"
              options={[
                { value: "telefon", label: "Telefonla" },
                { value: "eposta", label: "E-postayla" },
              ]}
              aria-label="Nasıl"
              className="w-36"
            />
          </div>
        )}
        <Textarea name="note" rows={2} placeholder="Not (isteğe bağlı)" aria-label="Not" />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" disabled={pending || !outcome}>
            Kaydet
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={laterPending}
            onClick={() => start(async () => setLater(await askResultLaterAction(r.id)))}
          >
            {r.resultAsks >= maxResultReasks ? "Bilmiyorum, kapat" : "Henüz belli değil, sonra sor"}
          </Button>
          {later?.error && <span className="text-destructive text-xs">{later.error}</span>}
        </div>
        <FormStatus state={state} saved="Kaydedildi." />
      </form>
    </article>
  );
}
