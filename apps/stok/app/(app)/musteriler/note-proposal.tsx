"use client";

import { useState, useTransition } from "react";
import { Button } from "@artek/ui/components/button";
import { fieldLabels, fieldValue, linkLabels } from "@/lib/customer-fields";
import { applyNoteProposalAction, customerHistoryAction, rejectNoteProposalAction } from "./actions";

export type CardNote = Awaited<ReturnType<typeof customerHistoryAction>>["notes"][number];

// What the assistant read in a note; nothing on the card changes until someone presses Uygula.
export function NoteProposal({ n, canEdit, onDone }: { n: CardNote; canEdit: boolean; onDone: () => void }) {
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
            <span className="text-muted-foreground">Bağlantı:</span> {linkLabels[p.relation ?? "diger"].from}: {p.relatedFirm}{" "}
            <span className="text-muted-foreground text-xs">
              {p.relatedFirmId ? "(müşterilerimizde bulundu; Uygula ile bağlanır)" : "(müşterilerimizde bulunamadı; elle bağlayabilirsiniz)"}
            </span>
          </li>
        )}
      </ul>
      <p className="text-muted-foreground text-xs">{p.explanation}</p>
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          {(p.changes.length > 0 || p.relatedFirmId) && (
            <Button type="button" size="sm" disabled={pending} onClick={() => run(applyNoteProposalAction)}>
              Uygula
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => run(rejectNoteProposalAction)}>
            {p.changes.length > 0 || p.relatedFirmId ? "Reddet" : "Tamam"}
          </Button>
          {error && <span className="text-destructive text-xs">{error}</span>}
        </div>
      )}
    </div>
  );
}
