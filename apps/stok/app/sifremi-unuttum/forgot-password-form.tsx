"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@artek/ui/components/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@artek/ui/components/field";
import { Input } from "@artek/ui/components/input";
import { authClient } from "@/lib/auth-client";

// Same reply for every email, so the page can't reveal who has an account.
export function ForgotPasswordForm() {
  const [state, setState] = useState<"idle" | "pending" | "sent" | "limited">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("pending");
    const { error } = await authClient.requestPasswordReset({
      email: String(new FormData(event.currentTarget).get("email")),
      redirectTo: "/sifre-belirle",
    });
    setState(error?.status === 429 ? "limited" : "sent");
  }

  if (state === "sent") {
    return (
      <FieldGroup>
        <p className="text-center text-sm">
          Bu e-posta ile etkin bir hesap varsa, şifre sıfırlama bağlantısı gönderildi. Bağlantı 1 saat geçerlidir.
        </p>
        <Link href="/giris" className="text-center text-sm underline underline-offset-4">
          Girişe dön
        </Link>
      </FieldGroup>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">E-posta</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="ad@ferritnuve.com" required />
        </Field>
        {state === "limited" && <FieldError role="alert">Çok fazla deneme yapıldı; biraz sonra tekrar deneyin.</FieldError>}
        <Field>
          <Button type="submit" disabled={state === "pending"}>
            {state === "pending" ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
          </Button>
          <FieldDescription className="text-center">
            <Link href="/giris">Girişe dön</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
