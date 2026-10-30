"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Plus, Upload } from "lucide-react";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { Button } from "@artek/ui/components/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@artek/ui/components/sheet";
import { Textarea } from "@artek/ui/components/textarea";
import { cn } from "@artek/ui/lib/utils";
import { FormSelect } from "@/components/form-select";
import { FormStatus } from "@/components/form-status";
import type { LeadContact, LeadResearch, LeadSource } from "@/db/schema";
import { leadStatusLabels } from "@/lib/lead-status";
import { ArchiveControl } from "@/components/archive-control";
import { addLeadAction, addLeadFromLinkAction, archiveLeadAction, deepResearchAction, importLeadsAction, leadEventsAction, linkLeadAction, restoreLeadAction, updateLeadAction } from "./actions";

type Status = keyof typeof leadStatusLabels;
export type LeadRow = {
  id: string;
  name: string;
  website: string | null;
  city: string | null;
  sector: string | null;
  why: string | null;
  contact: LeadContact;
  sources: LeadSource[];
  status: Status;
  seenCount: number;
  lastSeenAt: string;
  archivedAt: string | null;
  archiveReason: string | null;
  siteResearch: LeadResearch | null;
  deepResearch: LeadResearch | null;
  customer: { id: string; name: string } | null;
  candidate: { id: string; name: string } | null;
};

const tones: Record<Status, string> = {
  yeni: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  ulasildi: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  gorusuluyor: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200",
  musteri_oldu: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  ilgilenmiyor: "bg-muted text-muted-foreground",
};
const dateText = (iso: string) => new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" });

export function LeadsBoard({ rows, canEdit, initialOpen }: { rows: LeadRow[]; canEdit: boolean; initialOpen?: string }) {
  const [filter, setFilter] = useState<Status | "" | "arsiv">("");
  const [openId, setOpenId] = useState<string | undefined>(rows.some((r) => r.id === initialOpen) ? initialOpen : undefined);
  const live = rows.filter((r) => !r.archivedAt);
  const archivedCount = rows.length - live.length;
  const counts = Object.fromEntries((Object.keys(leadStatusLabels) as Status[]).map((s) => [s, live.filter((r) => r.status === s).length]));
  const shown = filter === "arsiv" ? rows.filter((r) => r.archivedAt) : live.filter((r) => !filter || r.status === filter);
  const list = (
    <>
      {rows.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          Henüz aday yok. Satış rutinleri bir sonraki raporlarında buldukları firmaları buraya ekleyecek.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            <Button type="button" size="sm" variant={filter === "" ? "secondary" : "ghost"} onClick={() => setFilter("")}>
              Hepsi ({live.length})
            </Button>
            {(Object.keys(leadStatusLabels) as Status[]).map((s) => (
              <Button key={s} type="button" size="sm" variant={filter === s ? "secondary" : "ghost"} onClick={() => setFilter(s)}>
                {leadStatusLabels[s]} ({counts[s]})
              </Button>
            ))}
            {archivedCount > 0 && (
              <Button type="button" size="sm" variant={filter === "arsiv" ? "secondary" : "ghost"} onClick={() => setFilter("arsiv")}>
                Arşiv ({archivedCount})
              </Button>
            )}
          </div>
          <ul className="bg-card divide-y overflow-hidden rounded-xl border">
            {shown.map((r) => (
              <li key={r.id}>
                <button type="button" onClick={() => setOpenId(r.id)} className="hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">{r.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {[r.city, r.sector].filter(Boolean).join(" · ")}
                      {r.why && ` — ${r.why}`}
                    </span>
                  </span>
                  {r.candidate && (
                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-950 dark:text-green-200">
                      Müşteri olmuş olabilir
                    </span>
                  )}
                  {r.seenCount > 1 && <span className="text-muted-foreground shrink-0 text-xs">{r.seenCount} kez görüldü</span>}
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", tones[r.status])}>{leadStatusLabels[r.status]}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      {canEdit ? <ImportArea>{list}</ImportArea> : list}
      <Sheet open={Boolean(openId)} onOpenChange={(open) => !open && setOpenId(undefined)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {openId && rows.find((r) => r.id === openId) && <LeadPanel key={openId} r={rows.find((r) => r.id === openId)!} canEdit={canEdit} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h3>
      {children}
    </section>
  );
}

function LeadPanel({ r, canEdit }: { r: LeadRow; canEdit: boolean }) {
  const router = useRouter();
  const [events, setEvents] = useState<Awaited<ReturnType<typeof leadEventsAction>> | null>(null);
  const [, startLoading] = useTransition();
  const [state, action, pending] = useActionState(updateLeadAction, undefined);
  const [linkError, setLinkError] = useState<string>();
  const [linking, startLinking] = useTransition();

  useEffect(() => {
    startLoading(async () => setEvents(await leadEventsAction(r.id)));
  }, [r.id, state, r.customer]);
  useEffect(() => {
    if (state?.saved) router.refresh();
  }, [state, router]);

  const contact = [
    r.contact.phone && ["Telefon", r.contact.phone],
    r.contact.email && ["E-posta", r.contact.email],
    r.contact.form && ["Form", r.contact.form],
    r.contact.linkedin && ["LinkedIn", r.contact.linkedin],
  ].filter(Boolean) as [string, string][];

  return (
    <>
      <SheetHeader className="gap-2">
        <span className={cn("self-start rounded-full px-2 py-0.5 text-xs font-medium", tones[r.status])}>{leadStatusLabels[r.status]}</span>
        <SheetTitle className="text-xl leading-tight font-semibold">{r.name}</SheetTitle>
        <SheetDescription>{[r.city, r.sector].filter(Boolean).join(" · ")}</SheetDescription>
      </SheetHeader>
      <div className="flex flex-col gap-6 px-4 pb-8">
        {r.customer ? (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-900 dark:bg-green-950 dark:text-green-100">
            Müşteri oldu:{" "}
            <Link href={`/musteriler?secili=${r.customer.id}`} className="font-medium underline underline-offset-4">
              {r.customer.name}
            </Link>
          </p>
        ) : (
          r.candidate && (
            <div className="flex flex-col gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm dark:border-green-900 dark:bg-green-950/40">
              <p>
                Bu aday müşterimiz <b>{r.candidate.name}</b> olmuş olabilir (adlar benziyor).
              </p>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={linking}
                    onClick={() =>
                      startLinking(async () => {
                        const s = await linkLeadAction(r.id, r.candidate!.id);
                        setLinkError(s?.error);
                        if (!s?.error) router.refresh();
                      })
                    }
                  >
                    Evet, bağla
                  </Button>
                  {linkError && <span className="text-destructive text-xs">{linkError}</span>}
                </div>
              )}
            </div>
          )
        )}

        {r.siteResearch && (
          <Section title="Siteden okunanlar">
            <Research r={r.siteResearch} />
          </Section>
        )}

        <Section title="Site + haber taraması">
          {r.deepResearch && <Research r={r.deepResearch} />}
          {canEdit && <DeepResearchButton id={r.id} again={Boolean(r.deepResearch)} />}
          {!r.deepResearch && !canEdit && <p className="text-muted-foreground text-xs">Henüz yapılmadı.</p>}
        </Section>

        {r.why && (
          <Section title="Neden ilginç">
            <p className="text-sm leading-relaxed">{r.why}</p>
          </Section>
        )}

        <Section title="İletişim">
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
            {r.website && (
              <>
                <dt className="text-muted-foreground">Web</dt>
                <dd className="truncate">
                  <a href={r.website.startsWith("http") ? r.website : `https://${r.website}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {r.website}
                  </a>
                </dd>
              </>
            )}
            {contact.map(([k, v]) => (
              <span key={k} className="contents">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="break-words">{v}</dd>
              </span>
            ))}
          </dl>
          {!r.website && contact.length === 0 && <p className="text-muted-foreground text-xs">Raporda iletişim bilgisi yok.</p>}
        </Section>

        <Section title={`Hangi raporlarda geçti (${r.sources.length})`}>
          <ul className="flex flex-col gap-2 text-sm">
            {r.sources.map((s) => (
              <li key={`${s.report}-${s.at}`}>
                <span className="font-medium">{s.report}</span> <span className="text-muted-foreground text-xs">{s.at}</span>
                {s.links.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-0.5 pl-3">
                    {s.links.map((l) => (
                      <li key={l.url} className="text-xs">
                        <a href={l.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                          {l.title || l.url}
                        </a>
                        {l.date && <span className="text-muted-foreground"> · {l.date}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {canEdit && r.status !== "musteri_oldu" && (
          <Section title="Durum ve not">
            <form action={action} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={r.id} />
              <FormSelect
                name="status"
                defaultValue={r.status}
                options={(Object.keys(leadStatusLabels) as Status[]).filter((s) => s !== "musteri_oldu").map((s) => ({ value: s, label: leadStatusLabels[s] }))}
                aria-label="Durum"
                className="w-48"
              />
              <Textarea name="note" rows={2} placeholder="Ne yapıldı, ne konuşuldu? (isteğe bağlı)" aria-label="Not" />
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  Kaydet
                </Button>
                <FormStatus state={state} saved="Kaydedildi." />
              </div>
            </form>
          </Section>
        )}

        {canEdit && (
          <Section title="Arşiv">
            {r.archivedAt && <p className="text-sm">Arşivde{r.archiveReason && `: ${r.archiveReason}`}</p>}
            <ArchiveControl archived={Boolean(r.archivedAt)} onArchive={(reason) => archiveLeadAction(r.id, reason)} onRestore={() => restoreLeadAction(r.id)} />
          </Section>
        )}

        <Section title="Geçmiş">
          {!events ? (
            <p className="text-muted-foreground text-xs">Yükleniyor…</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {events.map((e) => (
                <li key={e.id}>
                  <span className={cn(e.kind === "not" && "whitespace-pre-wrap")}>{e.text}</span>
                  <span className="text-muted-foreground block text-xs">
                    {e.author ?? "rutin / fatura"} · {dateText(e.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}

// Loads a report's Adaylar from a JSON file, the same shape the routines send to /api/adaylar.
// The routines' JSON from Drive "Adaylar (yüklenecek)": chosen with the button or dropped anywhere on the board.
function ImportArea({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function load(file: File) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await importLeadsAction(JSON.parse(await file.text()));
      setMessage(
        result.error
          ? { text: result.error, error: true }
          : { text: `${result.added} yeni aday eklendi, ${result.seen} tanesi tekrar görüldü, ${result.customers} tanesi zaten müşterimiz.` },
      );
      router.refresh();
    } catch {
      setMessage({ text: "Dosya okunamadı; rutinin yazdığı .json dosyasını seçtiğinizden emin olun.", error: true });
    }
    setBusy(false);
  }

  return (
    <div
      className={cn("relative flex flex-col gap-4 rounded-xl", dragging && "ring-primary ring-2 ring-offset-4")}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) load(file);
      }}
    >
    <div className="flex flex-wrap items-center gap-2">
      <LinkAdd />
      <span className="flex-1" />
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) load(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        title="Drive'daki dosyayı bu sayfaya sürükleyip de bırakabilirsin."
        onClick={() => input.current?.click()}
      >
        <Upload />
        {busy ? "Yükleniyor…" : "Adayları yükle"}
      </Button>
      <NewLead />
      {message && <span className={cn("basis-full text-xs", message.error ? "text-destructive" : "text-muted-foreground")}>{message.text}</span>}
    </div>
    {children}
    {dragging && (
      <div className="bg-background/80 pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl text-sm font-medium">
        Bırak, adaylar eklensin
      </div>
    )}
    </div>
  );
}

function Research({ r }: { r: LeadResearch }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p className="leading-relaxed">{r.summary}</p>
      {r.points.length > 0 && (
        <ul className="list-disc pl-5 leading-relaxed">
          {r.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {r.productLines.length > 0 && (
        <p>
          <span className="text-muted-foreground">Uyabilecek ürün hatları:</span> {r.productLines.join(", ")}
        </p>
      )}
      {r.sources.length > 0 && (
        <ul className="flex flex-col gap-1">
          {r.sources.map((s) => (
            <li key={s.url} className="text-xs">
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                {s.title || s.url}
              </a>
              {s.date && <span className="text-muted-foreground"> · {s.date}</span>}
              {s.summary && <span className="text-muted-foreground"> · {s.summary}</span>}
            </li>
          ))}
        </ul>
      )}
      <p className="text-muted-foreground text-xs">
        {dateText(r.at)} · {r.seconds} sn sürdü
      </p>
    </div>
  );
}

function DeepResearchButton({ id, again }: { id: string; again: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const s = await deepResearchAction(id);
            setError(s?.error);
            if (!s?.error) router.refresh();
          })
        }
      >
        {pending ? "Taranıyor… (1-2 dakika sürebilir)" : again ? "Tekrar tara" : "Site + haber taraması yap"}
      </Button>
      {error && <span className="text-destructive text-xs">{error}</span>}
      {!pending && !again && <span className="text-muted-foreground text-xs">Siteye ve son haberlere bakar; sabahki asistanın modeliyle çalışır.</span>}
    </div>
  );
}

// "Linkle ekle": paste the firm's site; the assistant reads only that site and fills the card.
function LinkAdd() {
  const [link, setLink] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ id?: string; existed?: boolean; error?: string }>();
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => setResult(await addLeadFromLinkAction(link)));
      }}
    >
      <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Şirket sitesi, ör. ornek.com.tr" aria-label="Şirket sitesi" className="h-8 w-64" />
      <Button type="submit" size="sm" disabled={pending || !link.trim()}>
        {pending ? "Site okunuyor…" : "Linkle ekle"}
      </Button>
      {result?.error && <span className="text-destructive text-xs">{result.error}</span>}
      {result?.id && (
        <a href={`/musteriler/adaylar?secili=${result.id}`} className="text-xs underline underline-offset-4">
          {result.existed ? "Bu firma zaten Adaylar'da, kartı aç" : "Eklendi, kartı aç"}
        </a>
      )}
    </form>
  );
}

// "Yeni aday": a firm found by hand; repeats and existing Müşteriler are refused with their name.
function NewLead() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addLeadAction, undefined);
  if (!open)
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        <Plus /> Yeni aday
      </Button>
    );
  const field = (name: string, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <Label className="flex-col items-stretch gap-1 text-xs font-normal">
      {label}
      <Input name={name} {...props} />
    </Label>
  );
  return (
    <form action={action} className="bg-card flex w-full flex-col gap-3 rounded-xl border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", "Firma adı", { required: true })}
        {field("website", "Web sitesi", { placeholder: "ornek.com.tr" })}
        {field("city", "Şehir")}
        {field("sector", "Sektör", { placeholder: "Ör. UPS / redresör" })}
        {field("phone", "Telefon (santral)")}
        {field("email", "Genel e-posta", { type: "email" })}
        {field("taxId", "Vergi numarası (biliyorsan)", { inputMode: "numeric" })}
      </div>
      <Label className="flex-col items-stretch gap-1 text-xs font-normal">
        Neden ilginç?
        <Textarea name="why" rows={2} placeholder="Ör. yeni fabrika açtı, güç kaynağı üretiyor" />
      </Label>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          Adayı ekle
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Kapat
        </Button>
        {state?.saved && state.id ? (
          <a href={`/musteriler/adaylar?secili=${state.id}`} className="text-sm underline underline-offset-4">
            Eklendi, kartı aç
          </a>
        ) : (
          <FormStatus state={state} />
        )}
      </div>
    </form>
  );
}
