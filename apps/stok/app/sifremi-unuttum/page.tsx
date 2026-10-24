import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@artek/ui/components/card";
import { AuthShell } from "@/components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "Şifremi unuttum | Artek Stok" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Şifremi unuttum</CardTitle>
          <CardDescription>E-posta adresinize yeni şifre belirleme bağlantısı gönderelim</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </AuthShell>
  );
}
