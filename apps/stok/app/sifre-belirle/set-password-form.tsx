"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Input } from "@artek/ui/components/input";
import { Label } from "@artek/ui/components/label";
import type { ActionState } from "@/lib/action-result";

export function SetPasswordForm({ action }: { action: (state: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Yeni şifre</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Yeni şifre (tekrar)</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state?.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Şifremi kaydet"}
      </Button>
    </form>
  );
}
