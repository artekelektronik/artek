"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Field, FieldGroup, FieldLabel } from "@artek/ui/components/field";
import { FormStatus } from "@/components/form-status";
import { PasswordInput } from "@/components/password-input";
import type { ActionState } from "@/lib/action-result";

export function SetPasswordForm({ action }: { action: (state: ActionState, formData: FormData) => Promise<ActionState> }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="password">Yeni şifre</FieldLabel>
          <PasswordInput id="password" name="password" autoComplete="new-password" minLength={8} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Yeni şifre (tekrar)</FieldLabel>
          <PasswordInput id="confirm" name="confirm" autoComplete="new-password" minLength={8} required />
        </Field>
        <FormStatus state={state} />
        <Field>
          <Button type="submit" disabled={pending}>
            {pending ? "Kaydediliyor…" : "Şifremi kaydet"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
