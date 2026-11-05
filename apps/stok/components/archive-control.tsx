"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@artek/ui/components/dialog";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { toast } from "sonner";

type Result = { error?: string } | undefined;

// "Arşivle" asks for a short reason in a dialog; "Geri al" restores. Both refresh the page when they're done.
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
  const [pending, start] = useTransition();
  const run = (action: () => Promise<Result>, done: string) =>
    start(async () => {
      const result = await action();
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(done);
      setAsking(false);
      setReason("");
      router.refresh();
    });

  if (archived)
    return (
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(onRestore, "Arşivden çıkarıldı.")}>
        <ArchiveRestore /> Geri al
      </Button>
    );
  return (
    <Dialog open={asking} onOpenChange={setAsking}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="ghost" className="text-muted-foreground">
          <Archive /> {compact ? "" : "Arşivle"}
          {compact && <span className="sr-only">Arşivle</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => onArchive(reason), "Arşivlendi.");
          }}
        >
          <DialogHeader>
            <DialogTitle>Arşivle</DialogTitle>
            <DialogDescription>Arşivdekiler listeden kalkar; istediğinizde geri alabilirsiniz.</DialogDescription>
          </DialogHeader>
          <Label className="flex-col items-stretch gap-1">
            Sebep
            <Input autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ör. yanlış yüklendi" className="font-normal" />
          </Label>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              Arşivle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
