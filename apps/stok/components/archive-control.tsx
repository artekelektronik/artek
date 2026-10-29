"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";

type Result = { error?: string } | undefined;

// "Arşivle" asks for a short reason in place; "Geri al" restores. Both refresh the page when they're done.
export function ArchiveControl({
  archived,
  onArchive,
  onRestore,
  compact = false,
}: {
  archived: boolean;
  onArchive: (reason: string) => Promise<Result>;
  onRestore: () => Promise<Result>;
  compact?: boolean;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const run = (action: () => Promise<Result>) =>
    start(async () => {
      const result = await action();
      setError(result?.error);
      if (!result?.error) {
        setAsking(false);
        setReason("");
        router.refresh();
      }
    });

  if (archived)
    return (
      <span className="inline-flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(onRestore)}>
          <ArchiveRestore /> Geri al
        </Button>
        {error && <span className="text-destructive text-xs">{error}</span>}
      </span>
    );
  if (!asking)
    return (
      <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setAsking(true)}>
        <Archive /> {compact ? "" : "Arşivle"}
        {compact && <span className="sr-only">Arşivle</span>}
      </Button>
    );
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Input
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Neden? (ör. yanlış yüklendi)"
        aria-label="Arşivleme sebebi"
        className="h-8 w-56"
        onKeyDown={(e) => {
          if (e.key === "Enter") run(() => onArchive(reason));
          if (e.key === "Escape") setAsking(false);
        }}
      />
      <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => run(() => onArchive(reason))}>
        Arşivle
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setAsking(false)}>
        Vazgeç
      </Button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </span>
  );
}
