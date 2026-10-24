import type { Email } from "./email";

// The email carrying a Better Auth reset-password token to /sifre-belirle: an invite for someone who
// has never set a password, a reset otherwise.
export function passwordEmail(target: { email: string; name: string }, kind: "invite" | "reset", token: string): Email {
  const origin = process.env.BETTER_AUTH_URL ?? "http://localhost:3001";
  const link = new URL(`/sifre-belirle?token=${token}`, origin).toString();
  const login = new URL("/giris", origin).toString();
  return kind === "invite"
    ? {
        to: [target.email],
        subject: "Artek Stok hesabınız açıldı",
        text: `Merhaba ${target.name},\n\nArtek Stok'ta sizin için bir hesap açıldı. Şifrenizi belirlemek için 7 gün içinde bu bağlantıyı açın:\n${link}\n\nSonra ${login} adresinden ${target.email} ile giriş yapabilirsiniz.`,
        idempotencyKey: token,
      }
    : {
        to: [target.email],
        subject: "Artek Stok şifre sıfırlama",
        text: `Merhaba ${target.name},\n\nYeni şifrenizi belirlemek için 1 saat içinde bu bağlantıyı açın:\n${link}\n\nBu isteği siz yapmadıysanız bu e-postayı yok sayabilir, yöneticinize haber verebilirsiniz.`,
        idempotencyKey: token,
      };
}
