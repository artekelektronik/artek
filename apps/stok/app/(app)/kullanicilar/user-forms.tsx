"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import type { ActionState } from "@/lib/action-result";

function Status({ state, saved }: { state: ActionState; saved: string }) {
  if (state?.error) {
    return (
      <p role="alert" className="text-destructive text-sm">
        {state.error}
      </p>
    );
  }
  return state?.saved ? <p className="text-sm text-green-700">{saved}</p> : null;
}

export function InviteForm({
  action,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      <Label className="flex-col items-stretch gap-1">
        Ad soyad
        <Input name="name" required autoComplete="off" />
      </Label>
      <Label className="flex-col items-stretch gap-1">
        E-posta
        <Input name="email" type="email" required autoComplete="off" />
      </Label>
      {children}
      <Status state={state} saved="" />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Gönderiliyor…" : "Davet gönder"}
      </Button>
    </form>
  );
}

export function AccessForm({
  action,
  children,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {children}
      <Status state={state} saved="Yetkiler kaydedildi." />
      <Button type="submit" variant="outline" disabled={pending} className="self-start">
        Yetkileri kaydet
      </Button>
    </form>
  );
}

export function UserActionButton({
  action,
  label,
  done,
  variant = "outline",
}: {
  action: () => Promise<ActionState>;
  label: string;
  done: string;
  variant?: "outline" | "destructive";
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-1">
      <Button type="submit" variant={variant} size="sm" disabled={pending}>
        {label}
      </Button>
      <Status state={state} saved={done} />
    </form>
  );
}
