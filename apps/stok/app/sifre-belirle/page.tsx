import { setPasswordAction } from "./actions";
import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Şifre belirle | Artek Stok" };

// Opened from an invite or password-reset email; the token in the link is checked when the form is sent.
export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Şifre belirle</h1>
          <p className="text-muted-foreground text-sm">En az 8 karakter. Şifrenizi sizden başka kimse göremez.</p>
        </div>
        {token ? (
          <SetPasswordForm action={setPasswordAction.bind(null, token)} />
        ) : (
          <p role="alert" className="text-destructive text-sm">
            Bağlantı eksik. E-postadaki bağlantıyı açın veya yöneticinizden yeni bir bağlantı isteyin.
          </p>
        )}
      </div>
    </main>
  );
}
