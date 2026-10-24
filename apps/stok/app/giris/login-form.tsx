"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@artek/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@artek/ui/components/field";
import { Input } from "@artek/ui/components/input";
import { PasswordInput } from "@/components/password-input";
import { authClient } from "@/lib/auth-client";

// shadcn login-03 without social sign-in or sign-up (accounts are invite-only).
export function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  // Through /api/auth, so Better Auth rate-limits it.
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setError(error.status === 429 ? "Çok fazla deneme yapıldı; biraz sonra tekrar deneyin." : "E-posta veya şifre hatalı.");
      setPending(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Hoş geldiniz</CardTitle>
        <CardDescription>E-posta adresiniz ve şifrenizle giriş yapın</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit}>
          <FieldGroup>
            {notice && <p className="text-center text-sm text-green-700">{notice}</p>}
            <Field>
              <FieldLabel htmlFor="email">E-posta</FieldLabel>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="ad@ferritnuve.com" required />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Şifre</FieldLabel>
                <Link href="/sifremi-unuttum" className="ml-auto text-sm underline-offset-4 hover:underline">
                  Şifremi unuttum
                </Link>
              </div>
              <PasswordInput id="password" name="password" autoComplete="current-password" required />
            </Field>
            {error && <FieldError role="alert">{error}</FieldError>}
            <Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Giriş yapılıyor…" : "Giriş yap"}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
