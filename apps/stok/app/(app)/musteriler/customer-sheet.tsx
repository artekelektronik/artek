"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@artek/ui/components/sheet";
import { Textarea } from "@artek/ui/components/textarea";
import { cn } from "@artek/ui/lib/utils";
import { DatePicker } from "@/components/date-picker";
import { FormSelect } from "@/components/form-select";
import { FormStatus } from "@/components/form-status";
import { PriorityBadge } from "@/components/priority-badge";
import {
  customerStatusLabels,
  day,
  followUpChannelLabels,
  tl,
  type FollowUpChannel,
} from "@/lib/finance-calc";
import { fieldLabels, fieldValue, sourceLabels } from "@/lib/customer-fields";
import {
  addNoteAction,
  applyNoteProposalAction,
  customerHistoryAction,
  rejectNoteProposalAction,
  setEmailOptOutAction,
  updateCustomerAction,
} from "./actions";
import type { CrmRow } from "./crm-board";

type History = Awaited<ReturnType<typeof customerHistoryAction>>;
type Note = History["notes"][number];

const timeText = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "medium", timeStyle: "short" });

// What the assistant read in a note; nothing on the card changes until someone presses Uygula.
function NoteProposal({ n, canEdit, onDone }: { n: Note; canEdit: boolean; onDone: () => void }) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  if (!n.proposal || n.proposalDecidedAt) return null;
  const p = n.proposal;
  const run = (action: (id: string) => Promise<{ error?: string } | undefined>) =>
    start(async () => {
      const state = await action(n.id);
      if (state?.error) setError(state.error);
      else onDone();
    });
  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
      <p className="text-xs font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-300">Asistanın önerisi</p>
      <ul className="flex flex-col gap-1">
        {p.changes.map((ch) => (
          <li key={ch.field}>
            <span className="text-muted-foreground">{fieldLabels[ch.field]}:</span> {fieldValue(ch.field, ch.value)}
          </li>
        ))}
        {p.relatedFirm && (
          <li>
            <span className="text-muted-foreground">Bağlantılı firma:</span> {p.relatedFirm}{" "}
            <span className="text-muted-foreground text-xs">(firma bağlantıları gelince kurulacak; şimdilik not olarak kalır)</span>
          </li>
        )}
      </ul>
      <p className="text-muted-foreground text-xs">{p.explanation}</p>
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          {p.changes.length > 0 && (
            <Button type="button" size="sm" disabled={pending} onClick={() => run(applyNoteProposalAction)}>
              Uygula
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run(rejectNoteProposalAction)}>
            {p.changes.length > 0 ? "Reddet" : "Tamam"}
          </Button>
          {error && <span className="text-destructive text-xs">{error}</span>}
        </div>
      )}
    </div>
  );
}

function Copy({ value }: { value: string }) {
  const [label, setLabel] = useState("Kopyala");
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground rounded border px-1.5 text-xs"
      onClick={() =>
        navigator.clipboard.writeText(value).then(
          () => {
            setLabel("Kopyalandı");
            setTimeout(() => setLabel("Kopyala"), 1500);
          },
          () => setLabel("Seçip kopyalayın"),
        )
      }
    >
      {label}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

// The whole customer on one side panel: what to talk about, how to reach them, the next follow-up, notes, history.
export function CustomerSheet({
  customer,
  canEdit,
  onClose,
}: {
  customer: CrmRow | undefined;
  canEdit: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(customer)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {customer && (
          <CustomerPanel key={customer.id} c={customer} canEdit={canEdit} />
        )}
      </SheetContent>
    </Sheet>
  );
}

// Keyed by customer, so switching rows starts from that customer's saved values.
function CustomerPanel({ c, canEdit }: { c: CrmRow; canEdit: boolean }) {
  const router = useRouter();
  const [history, setHistory] = useState<History | null>(null);
  const [, startLoading] = useTransition();
  const [saveState, saveAction, saving] = useActionState(
    updateCustomerAction,
    undefined,
  );
  const [noteState, noteAction, noting] = useActionState(
    addNoteAction,
    undefined,
  );
  const [channel, setChannel] = useState<FollowUpChannel>(c.followUpChannel);
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    startLoading(async () => setHistory(await customerHistoryAction(c.id)));
  }, [c.id, noteState, saveState, reloads]);

  // After a save the list behind the panel shows the new status and follow-up date.
  useEffect(() => {
    if (saveState?.saved || noteState?.saved) router.refresh();
  }, [saveState, noteState, router]);

  return (
    <>
      <SheetHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <PriorityBadge no={c.no} />
          <span className="text-muted-foreground text-xs">
            {customerStatusLabels[c.status]}
          </span>
        </div>
        <SheetTitle className="font-serif text-2xl font-normal leading-tight">
          {c.name}
        </SheetTitle>
        <SheetDescription>
          {[c.district, c.city].filter(Boolean).join(" / ")}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-4 pb-8">
        <p className="bg-muted rounded-lg p-3 text-sm">{c.talk}</p>

        <Section title="İletişim">
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16 text-xs">
                Telefon
              </span>
              {c.phone ? (
                <>
                  <a
                    href={`tel:${c.phone.replace(/\s/g, "")}`}
                    className="font-medium tabular-nums"
                  >
                    {c.phone}
                  </a>
                  <Copy value={c.phone} />
                </>
              ) : (
                <span className="text-muted-foreground">
                  {c.isPerson
                    ? "Şahıs firması: kendi kayıtlarınızdan"
                    : "Bulunamadı"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-16 text-xs">
                E-posta
              </span>
              {c.email ? (
                <>
                  <span className="[overflow-wrap:anywhere]">{c.email}</span>
                  <Copy value={c.email} />
                </>
              ) : (
                <span className="text-muted-foreground">Bulunamadı</span>
              )}
            </div>
            {c.website && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-16 text-xs">Web</span>
                <a
                  href={
                    /^https?:/.test(c.website)
                      ? c.website
                      : `https://${c.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 [overflow-wrap:anywhere]"
                >
                  {c.website}
                </a>
              </div>
            )}
            {c.about && (
              <p className="text-muted-foreground text-xs">{c.about}</p>
            )}
          </div>
        </Section>

        {canEdit && (
          <Section title="Takip">
            <form
              key={c.id}
              action={saveAction}
              className="flex flex-col gap-3"
            >
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="followUpChannel" value={channel} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="flex-col items-stretch gap-1 font-normal">
                  Durum
                  <FormSelect
                    name="status"
                    defaultValue={c.status}
                    options={Object.entries(customerStatusLabels).map(
                      ([value, label]) => ({ value, label }),
                    )}
                    className="w-full"
                  />
                </Label>
                <Label className="flex-col items-stretch gap-1 font-normal">
                  Sonraki takip
                  <DatePicker
                    id={`takip-${c.id}`}
                    name="nextFollowUpOn"
                    defaultValue={c.nextFollowUpOn ?? undefined}
                  />
                </Label>
              </div>
              <div
                className="flex items-center gap-2"
                role="radiogroup"
                aria-label="Takip şekli"
              >
                <span className="text-sm">Nasıl:</span>
                {(Object.keys(followUpChannelLabels) as FollowUpChannel[]).map(
                  (ch) => (
                    <button
                      key={ch}
                      type="button"
                      role="radio"
                      aria-checked={channel === ch}
                      onClick={() => setChannel(ch)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs",
                        channel === ch
                          ? "border-foreground bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {followUpChannelLabels[ch]}
                    </button>
                  ),
                )}
              </div>
              <details className="text-sm">
                <summary className="text-muted-foreground cursor-pointer text-xs">
                  İletişim bilgilerini düzenle
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["phone", "Telefon", c.phone],
                      ["email", "E-posta", c.email],
                      ["website", "Web sitesi", c.website],
                      ["contactSource", "Bilginin kaynağı", c.contactSource],
                    ] as const
                  ).map(([name, label, value]) => (
                    <Label
                      key={name}
                      className="flex-col items-stretch gap-1 font-normal"
                    >
                      {label}
                      <Input name={name} defaultValue={value ?? ""} />
                    </Label>
                  ))}
                  <Label className="flex-col items-stretch gap-1 font-normal sm:col-span-2">
                    Ne yapıyor
                    <Textarea
                      name="about"
                      defaultValue={c.about ?? ""}
                      rows={2}
                    />
                  </Label>
                </div>
              </details>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </Button>
                <FormStatus state={saveState} saved="Kaydedildi." />
              </div>
            </form>
          </Section>
        )}

        <Section title="Notlar">
          {canEdit && (
            <form
              key={`not-${c.id}`}
              action={noteAction}
              className="flex flex-col gap-2"
            >
              <input type="hidden" name="customerId" value={c.id} />
              <Textarea
                name="body"
                rows={2}
                placeholder="Görüşmede ne konuşuldu, ne söz verildi?"
                aria-label="Not"
              />
              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  disabled={noting}
                >
                  Not ekle
                </Button>
                <FormStatus state={noteState} saved="Not eklendi." />
              </div>
            </form>
          )}
          {!history ? (
            <p className="text-muted-foreground text-xs">Yükleniyor…</p>
          ) : history.notes.length === 0 ? (
            <p className="text-muted-foreground text-xs">Henüz not yok.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.notes.map((n) => (
                <li key={n.id} className="border-l-2 pl-3">
                  <p className="text-sm whitespace-pre-wrap">{n.body}</p>
                  <p className="text-muted-foreground text-xs">
                    {n.author} · {timeText(n.createdAt)}
                  </p>
                  <NoteProposal
                    n={n}
                    canEdit={canEdit}
                    onDone={() => {
                      setReloads((x) => x + 1);
                      router.refresh();
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {history && history.changes.length > 0 && (
          <Section title="Değişiklik geçmişi">
            <ul className="flex flex-col gap-1.5 text-sm">
              {history.changes.map((ch) => (
                <li key={ch.id}>
                  <span className="text-muted-foreground">{fieldLabels[ch.field]}:</span> {fieldValue(ch.field, ch.oldValue)} →{" "}
                  <b className="font-medium">{fieldValue(ch.field, ch.newValue)}</b>
                  <span className="text-muted-foreground block text-xs">
                    {sourceLabels[ch.source]} · {ch.author ?? "fatura"} · {timeText(ch.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Alışveriş">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground text-xs">Satış (KDV hariç)</dt>
            <dd className="tabular-nums">{tl(c.sales)}</dd>
            <dt className="text-muted-foreground text-xs">
              Fatura · sipariş günü
            </dt>
            <dd className="tabular-nums">
              {c.invoices} · {c.orderDays}
            </dd>
            <dt className="text-muted-foreground text-xs">İlk – son alım</dt>
            <dd className="tabular-nums">
              {day(c.firstOn)} – {day(c.lastOn)}
            </dd>
            <dt className="text-muted-foreground text-xs">Aldığı gruplar</dt>
            <dd>{c.groups.join(", ")}</dd>
            <dt className="text-muted-foreground text-xs">En çok aldığı</dt>
            <dd>{c.topProduct}</dd>
          </dl>
          {history && history.invoices.length > 0 && (
            <details className="text-sm">
              <summary className="text-muted-foreground cursor-pointer text-xs">
                {history.invoices.length} faturayı göster
              </summary>
              <ul className="mt-2 flex flex-col gap-1 text-xs tabular-nums">
                {history.invoices.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>
                      {day(i.issuedOn)} · {i.number}
                      {i.type === "IADE" ? " · İade" : ""}
                    </span>
                    <span>{tl(i.netAmount)}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Section>
      </div>
    </>
  );
}

// "İstemiyorum" replies land in the company inbox; this records them so no more email drafts are made.
function OptOut({ customerId, optedOut, canEdit }: { customerId: string; optedOut: boolean; canEdit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  if (!canEdit) return optedOut ? <p className="text-xs text-amber-700 dark:text-amber-400">E-posta almak istemiyor.</p> : null;
  return (
    <p className="flex items-center gap-2 text-xs">
      {optedOut ? <span className="text-amber-700 dark:text-amber-400">E-posta almak istemiyor; asistan e-posta önermez.</span> : null}
      <button
        type="button"
        disabled={pending}
        className="text-muted-foreground hover:text-foreground underline underline-offset-4"
        onClick={() =>
          start(async () => {
            await setEmailOptOutAction(customerId, !optedOut);
            router.refresh();
          })
        }
      >
        {optedOut ? "Yeniden e-posta gönderilebilir" : "E-posta istemiyor olarak işaretle"}
      </button>
    </p>
  );
}
