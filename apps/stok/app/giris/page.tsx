import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Giriş | Artek Stok" };

export default async function LoginPage() {
  if (await auth.api.getSession({ headers: await headers() })) redirect("/");

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Artek Stok</h1>
          <p className="text-muted-foreground text-sm">Hesabınız yöneticiniz tarafından açılır.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
