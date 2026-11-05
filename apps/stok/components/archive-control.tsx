"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import { FormDialog } from "@/components/form-dialog";

type Result = { error?: string } | undefined;

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
  const [pending, start] = useTransition();
  const done = (result: Result, message: string) => {
    if (result?.error) {
      toast.error(result.error);
      return false;
    }
    toast.success(message);
    router.refresh();
    return true;
  };

  if (archived)
    return (
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => start(async () => void done(await onRestore(), "Arşivden çıkarıldı."))}>
        <ArchiveRestore /> Geri al
      </Button>
    );
  return (
    <FormDialog
      className="sm:max-w-md"
      title="Arşivle"
      description="Arşivdekiler listeden kalkar; istediğinizde geri alabilirsiniz."
      submitLabel="Arşivle"
      pendingLabel="Arşivleniyor…"
      destructive
      trigger={
        <Button type="button" size="sm" variant="ghost" className="text-muted-foreground">
          <Archive /> {compact ? "" : "Arşivle"}
          {compact && <span className="sr-only">Arşivle</span>}
        </Button>
      }
      onSubmit={async (formData) => done(await onArchive(String(formData.get("reason") ?? "")), "Arşivlendi.")}
    >
      <Label className="flex-col items-stretch gap-1">
        Sebep
        <Input name="reason" autoFocus placeholder="ör. yanlış yüklendi" className="font-normal" />
      </Label>
    </FormDialog>
  );
}
