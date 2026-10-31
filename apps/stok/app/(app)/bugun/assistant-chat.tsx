"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUp, CalendarPlus, Check, ChevronRight, FileText, Phone, RotateCcw, Sparkles, UserPlus, type LucideIcon } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { cn } from "@artek/ui/lib/utils";
import type { FollowUpProposal } from "@/lib/chat";
import { addFollowUpAction } from "./actions";

export type BriefItem = { tone: keyof typeof tones; icon: keyof typeof icons; text: string; href?: string; action: string };
export type Message = { id: string; role: "user" | "assistant"; text: string; proposals: FollowUpProposal[]; error?: boolean };

// Apple-style coloured icon tiles, one colour per kind of news.
const tones = {
  green: "bg-green-500",
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  violet: "bg-violet-500",
};
const icons: Record<string, LucideIcon> = { takip: Phone, geri: RotateCcw, aday: UserPlus, fatura: FileText };

const starters = [
  "Bu hafta kimi aramalıyım?",
  "Geri kazanılacak müşterileri özetle",
  "Adaylardan hangisi en umut verici?",
  "En çok alan 5 müşterimizde son durum ne?",
];

export function AssistantChat({
  brief,
  canEdit,
  today,
  initial,
  earlierDays,
  followUps,
}: {
  brief: BriefItem[];
  canEdit: boolean;
  today: string;
  initial: Message[];
  earlierDays: { day: string; messages: Message[] }[];
  followUps: Record<string, string>;
}) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const seq = useRef(0); // keys for messages not saved yet
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const send = (text: string) => {
    const question = text.trim();
    if (!question || pending) return;
    const asked: Message = { id: `soru-${++seq.current}`, role: "user", text: question, proposals: [] };
    setMessages([...messages.filter((m) => !m.error), asked]);
    setDraft("");
    // A failed question isn't saved: it comes back to the box so it can be sent again.
    const failed = (text: string) => {
      setMessages((m) => [...m.filter((x) => x.id !== asked.id), { id: `hata-${++seq.current}`, role: "assistant", text, proposals: [], error: true }]);
      setDraft(question);
    };
    start(async () => {
      try {
        const response = await fetch("/api/sohbet", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ question }),
        });
        const json = await response.json();
        if (!response.ok) return failed(json.error);
        setMessages((m) => [...m, { id: json.id, role: "assistant", text: json.text, proposals: json.proposals }]);
      } catch {
        failed("Bağlantı koptu; birazdan tekrar deneyin.");
      }
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-violet-50 via-white to-sky-50 p-5 dark:from-violet-950/40 dark:via-card dark:to-sky-950/40">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Avatar />
          Sabah özeti
        </h2>
        <ul className="flex flex-col gap-1">
          {brief.map((b) => {
            const Icon = icons[b.icon];
            const body = (
              <>
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-white", tones[b.tone])}>
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="flex-1 text-sm leading-relaxed">{b.text}</span>
                {b.href && <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-label={b.action} />}
              </>
            );
            return (
              <li key={b.icon}>
                {b.href ? (
                  <Link href={b.href} className="hover:bg-background/70 flex items-center gap-3 rounded-xl p-2">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl p-2">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {messages.length > 0 && (
        <div className="flex flex-col gap-4">
          <Thread messages={messages} canEdit={canEdit} today={today} followUps={followUps} />
          {pending && (
            <div className="flex gap-3">
              <Avatar />
              <p className="bg-muted text-muted-foreground animate-pulse rounded-2xl rounded-tl-md px-4 py-2.5 text-sm">Kayıtlara bakıyor…</p>
            </div>
          )}
          <div ref={end} />
        </div>
      )}

      {/* Only the box stays at the bottom while scrolling; the starters sit in the page, so on a phone they don't cover the summary. */}
      <div className="flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {starters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border bg-white px-3 py-1.5 text-sm shadow-xs hover:border-violet-300 hover:bg-violet-50 dark:bg-card dark:hover:bg-violet-950/40"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="bg-card sticky bottom-4 flex items-end gap-2 rounded-2xl border p-2 shadow-sm focus-within:border-violet-400"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={1}
            placeholder="Asistana sorun… ör. “ABC Elektronik’i ne zaman aramalıyım?”"
            aria-label="Asistana mesaj"
            className="max-h-40 min-h-9 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none [field-sizing:content]"
          />
          <Button type="submit" size="icon" disabled={pending || !draft.trim()} className="size-9 rounded-full bg-blue-600 text-white hover:bg-blue-700" aria-label="Gönder">
            <ArrowUp />
          </Button>
        </form>
      </div>

      {earlierDays.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted-foreground px-1 text-xs font-medium">Önceki günler</h2>
          {earlierDays.map((d) => (
            <details key={d.day} className="group bg-card rounded-xl border">
              <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
                <ChevronRight className="text-muted-foreground size-4 transition-transform group-open:rotate-90" aria-hidden />
                <span className="font-medium">{dayLabel(d.day)}</span>
                <span className="text-muted-foreground truncate">· {d.messages.find((m) => m.role === "user")?.text}</span>
              </summary>
              <div className="flex flex-col gap-4 border-t p-4">
                <Thread messages={d.messages} canEdit={canEdit} today={today} followUps={followUps} />
              </div>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}

// One conversation: the person's questions on the right, the assistant's answers with their buttons on the left.
function Thread({ messages, canEdit, today, followUps }: { messages: Message[]; canEdit: boolean; today: string; followUps: Record<string, string> }) {
  return messages.map((m) =>
    m.role === "user" ? (
      <p key={m.id} className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm whitespace-pre-wrap text-white">
        {m.text}
      </p>
    ) : (
      <div key={m.id} className="flex max-w-[92%] gap-3">
        <Avatar />
        <div className="flex min-w-0 flex-col gap-2">
          <p
            className={cn(
              "rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
              m.error ? "bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-100" : "bg-muted",
            )}
          >
            {m.text}
          </p>
          {m.proposals.map((p) => (
            <Proposal key={`${p.customerId}-${p.on}`} p={p} canEdit={canEdit} today={today} added={followUps[p.customerId] === p.on} />
          ))}
        </div>
      </div>
    ),
  );
}

function Avatar() {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-sky-500 text-white">
      <Sparkles className="size-3.5" aria-hidden />
    </span>
  );
}

const dayLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });

// What the assistant proposes; nothing is saved until the person clicks.
function Proposal({ p, canEdit, today, added }: { p: FollowUpProposal; canEdit: boolean; today: string; added: boolean }) {
  const [state, setState] = useState<{ error?: string; saved?: boolean } | undefined>(added ? { saved: true } : undefined);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-green-200 bg-green-50/60 px-3 py-2.5 dark:border-green-900 dark:bg-green-950/30">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white">
        <CalendarPlus className="size-4" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{p.name}</span>
        <span className="text-muted-foreground text-xs">
          {p.kind === "arama" ? "Arama" : "E-posta"} · {dayLabel(p.on)} · {p.why}
        </span>
      </span>
      {state?.saved ? (
        <span className="flex basis-full items-center gap-1 pl-11 text-xs font-medium text-green-700 dark:text-green-400">
          <Check className="size-4" />
          {p.on > today ? "Eklendi; o sabah Takipler’de hazır olur" : "Eklendi; Takipler’de “Daha fazla öneri hazırla” ile hemen hazırlanır"}
        </span>
      ) : canEdit ? (
        <Button type="button" size="sm" disabled={pending} onClick={() => start(async () => setState(await addFollowUpAction(p.customerId, p.kind, p.on)))}>
          Takiplere ekle
        </Button>
      ) : null}
      {state?.error && <span className="text-destructive basis-full text-xs">{state.error}</span>}
    </div>
  );
}
