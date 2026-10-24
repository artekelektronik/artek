"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@artek/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@artek/ui/components/field";
import { Input } from "@artek/ui/components/input";
import { authClient } from "@/lib/auth-client";

// shadcn's login-03 block, without social sign-in or sign-up: accounts are opened by an admin.
export function LoginForm({ notice }: { notice?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  // Signs in through /api/auth so the request goes through Better Auth's rate limiter.
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
              <FieldLabel htmlFor="password">Şifre</FieldLabel>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
              <FieldDescription>Şifrenizi unuttuysanız yöneticinizden yeni bir bağlantı isteyin.</FieldDescription>
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
