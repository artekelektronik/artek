"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Textarea } from "@artek/ui/components/textarea";
import { DatePicker } from "@/components/date-picker";
import { FormStatus } from "@/components/form-status";
import { completeCallAction, sendEmailAction, skipAction } from "./actions";

export type SuggestionView = {
  id: string;
  kind: "arama" | "eposta";
  status: "bekliyor" | "gonderildi" | "yapildi" | "atlandi" | "basarisiz";
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

function Skip({ id }: { id: string }) {
  const [state, setState] = useState<{ error?: string } | undefined>();
  const [pending, start] = useTransition();
  return (
    <>
      <Button type="button" variant="ghost" disabled={pending} onClick={() => start(async () => setState(await skipAction(id)))}>
        Bugün değil
      </Button>
      {state?.error && <span className="text-destructive text-xs">{state.error}</span>}
    </>
  );
}

function Head({ s }: { s: SuggestionView }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Link href={`/musteriler?secili=${s.customer.id}`} className="font-medium underline-offset-4 hover:underline">
          {s.customer.name}
        </Link>
        <span className="text-muted-foreground text-xs">{s.customer.city}</span>
      </div>
      <p className="text-muted-foreground text-sm">{s.reason}</p>
    </div>
  );
}

export function CallCard({ s }: { s: SuggestionView }) {
  const [state, action, pending] = useActionState(completeCallAction, undefined);
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <Head s={s} />
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
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker id={`takip-${s.id}`} name="nextFollowUpOn" />
          <Button type="submit" disabled={pending}>
            Arandı, kaydet
          </Button>
          <Skip id={s.id} />
        </div>
        <FormStatus state={state} saved="Kaydedildi." />
      </form>
    </article>
  );
}

export function EmailCard({ s, signature }: { s: SuggestionView; signature: string }) {
  const [state, action, pending] = useActionState(sendEmailAction, undefined);
  return (
    <article className="bg-card flex flex-col gap-3 rounded-xl border p-4">
      <Head s={s} />
      <Findings items={s.findings} />
      <form action={action} className="flex flex-col gap-2 border-t pt-3">
        <input type="hidden" name="id" value={s.id} />
        <p className="text-muted-foreground text-xs">
          Kime: <span className="text-foreground">{s.customer.email}</span> · Gönderen: artek@ferritnuve.com
        </p>
        <Input name="subject" defaultValue={s.subject ?? ""} aria-label="Konu" className="font-medium" />
        <Textarea name="body" defaultValue={s.body ?? ""} rows={8} aria-label="E-posta metni" />
        <pre className="text-muted-foreground font-sans text-xs whitespace-pre-wrap">{signature}</pre>
        <div className="flex flex-wrap items-center gap-2">
          <DatePicker id={`takip-${s.id}`} name="nextFollowUpOn" />
          <Button type="submit" disabled={pending}>
            {pending ? "Gönderiliyor…" : "Gönder"}
          </Button>
          <Skip id={s.id} />
        </div>
        <FormStatus state={state} saved="Gönderildi; müşterinin kartına not düşüldü." />
      </form>
    </article>
  );
}

export function FailedCard({ s }: { s: SuggestionView }) {
  return (
    <article className="bg-card flex flex-col gap-2 rounded-xl border border-dashed p-4">
      <Head s={s} />
      <p className="text-destructive text-xs">Öneri hazırlanamadı: {s.error}</p>
      <div>
        <Skip id={s.id} />
      </div>
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
            setMessage(response.ok ? `${json.prepared} öneri hazır${json.failed ? `, ${json.failed} hazırlanamadı` : ""}.` : json.error);
          } catch {
            setMessage("Bağlantı koptu; birazdan tekrar deneyin.");
          }
          setBusy(false);
          router.refresh();
        }}
      >
        Önerileri şimdi hazırla
      </Button>
      {message && <span className="text-muted-foreground text-xs">{message}</span>}
    </div>
  );
}
