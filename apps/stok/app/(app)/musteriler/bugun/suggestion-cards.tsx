"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Textarea } from "@artek/ui/components/textarea";
import { DatePicker } from "@/components/date-picker";
import { FormSelect } from "@/components/form-select";
import { FormStatus } from "@/components/form-status";
import { closeReasons } from "@/lib/close-reasons";
import { addDays } from "@/lib/time";
import { approvalArrivedAction, closeUndoneAction, completeCallAction, postponeAction, sendEmailAction, waitForApprovalAction } from "./actions";

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

function Findings({ items }: { items: SuggestionView["findings"] }) {
  if (!items.length) return <p className="text-muted-foreground text-xs">İnternette yeni bir şey bulunamadı; geçmişimize göre hazırlandı.</p>;
  return (
    <ul className="flex flex-col gap-1">
      {items.map((f) => (
        <li key={f.url} className="text-xs">
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4">
            {f.title}
          </a>
          <span className="text-muted-foreground"> · {f.summary}</span>
        </li>
      ))}
    </ul>
  );
}

const reasonOptions = Object.entries(closeReasons).map(([value, r]) => ({ value, label: r.label }));
const quickDays = [
  { label: "3 gün", days: 3 },
  { label: "1 hafta", days: 7 },
  { label: "2 hafta", days: 14 },
];

// The other ways to close a suggestion besides doing it; each needs its reason, day or what we wait for.
function CloseOptions({ id, today }: { id: string; today: string }) {
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
          <FormSelect name="reason" options={reasonOptions} empty="Sebep seçin" aria-label="Sebep" />
          <Textarea name="note" rows={2} placeholder="Not (isteğe bağlı; “Diğer” için gerekli)" aria-label="Not" />
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
      <p className="text-muted-foreground text-sm">{s.reason}</p>
    </div>
  );
}

export function CallCard({ s, today }: { s: SuggestionView; today: string }) {
  const [state, action, pending] = useActionState(completeCallAction, undefined);
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <Head s={s} today={today} />
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground text-xs">Telefon</span>
        <span className="font-medium tabular-nums">{s.customer.phone ?? "Kartta yok"}</span>
      </div>
      {s.talkingPoints.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Sorabilecekleriniz</span>
          <ul className="list-disc pl-5 text-sm">
            {s.talkingPoints.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}
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
      <CloseOptions id={s.id} today={today} />
    </article>
  );
}

export function EmailCard({ s, signature, today }: { s: SuggestionView; signature: string; today: string }) {
  const [state, action, pending] = useActionState(sendEmailAction, undefined);
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <Head s={s} today={today} />
      <Findings items={s.findings} />
      <form action={action} className="flex flex-col gap-2 border-t pt-3">
        <input type="hidden" name="id" value={s.id} />
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
      <CloseOptions id={s.id} today={today} />
    </article>
  );
}

export function FailedCard({ s, today }: { s: SuggestionView; today: string }) {
  return (
    <article className="bg-card flex flex-col gap-2 rounded-xl border border-dashed p-4">
      <Head s={s} today={today} />
      <p className="text-destructive text-xs">Öneri hazırlanamadı: {s.error}</p>
      <CloseOptions id={s.id} today={today} />
    </article>
  );
}

// Back from "Onay bekliyor": either it came, and the suggestion opens again, or we keep waiting.
export function ApprovalCard({ s, today }: { s: SuggestionView; today: string }) {
  const [state, setState] = useState<{ error?: string } | undefined>();
  const [pending, start] = useTransition();
  const [waiting, waitAction, waitPending] = useActionState(waitForApprovalAction, undefined);
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border border-amber-300 p-4 dark:border-amber-800">
      <Head s={s} today={today} />
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
      <CloseOptions id={s.id} today={today} />
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
