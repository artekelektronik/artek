"use client";

import { useState } from "react";
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

// onSubmit returns true to close; fields remount (and reset) each time it opens.
export function FormDialog({
  trigger,
  title,
  description,
  submitLabel,
  pendingLabel = "Kaydediliyor…",
  destructive = false,
  className,
  onSubmit,
  children,
}: {
  trigger: React.ReactNode;
  title: string;
  description: React.ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  destructive?: boolean;
  className?: string;
  onSubmit: (formData: FormData) => Promise<boolean>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={className}>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            const done = await onSubmit(new FormData(event.currentTarget));
            setPending(false);
            if (done) setOpen(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Vazgeç
              </Button>
            </DialogClose>
            <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={pending}>
              {pending ? pendingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
