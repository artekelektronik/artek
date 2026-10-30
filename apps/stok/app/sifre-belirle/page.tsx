import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { AuthShell } from "@/components/auth-shell";
import { setPasswordAction } from "./actions";
import { SetPasswordForm } from "./set-password-form";

export const metadata = { title: "Şifre belirle | Artek" };

// The emailed token is checked when the form is sent.
export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <AuthShell>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Şifre belirle</CardTitle>
          <CardDescription>En az 8 karakter. Şifrenizi sizden başka kimse göremez.</CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <SetPasswordForm action={setPasswordAction.bind(null, token)} />
          ) : (
            <p role="alert" className="text-destructive text-center text-sm">
              Bağlantı eksik. E-postadaki bağlantıyı açın veya yöneticinizden yeni bir bağlantı isteyin.
            </p>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
