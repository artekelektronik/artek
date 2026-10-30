import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Giriş | Artek" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ sifre?: string }> }) {
  if (await auth.api.getSession({ headers: await headers() })) redirect("/");
  const { sifre } = await searchParams;

  return (
    <AuthShell>
      <LoginForm notice={sifre === "kaydedildi" ? "Şifreniz kaydedildi; şimdi giriş yapabilirsiniz." : undefined} />
    </AuthShell>
  );
}
