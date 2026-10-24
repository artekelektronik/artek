"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@artek/ui/components/field";
import { Input } from "@artek/ui/components/input";
import type { ActionState } from "@/lib/action-result";

export function SetPasswordForm({ action }: { action: (state: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">Yeni şifre</FieldLabel>
          <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Yeni şifre (tekrar)</FieldLabel>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
        </Field>
        {state?.error && <FieldError role="alert">{state.error}</FieldError>}
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Şifremi kaydet"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
