"use server";

import { APIError } from "better-auth/api";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { text } from "@/lib/form-data";

export async function setPasswordAction(token: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const password = text(formData, "password");
  if (password !== text(formData, "confirm")) return { error: "Şifreler aynı değil." };
  try {
    await auth.api.resetPassword({ body: { token, newPassword: password } });
  } catch (error) {
    if (!(error instanceof APIError)) throw error;
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code === "PASSWORD_TOO_SHORT") return { error: "Şifre en az 8 karakter olmalı." };
    if (code === "PASSWORD_TOO_LONG") return { error: "Şifre çok uzun." };
    return { error: "Bağlantı geçersiz veya süresi dolmuş. Yöneticinizden yeni bir bağlantı isteyin." };
  }
  redirect("/giris?sifre=kaydedildi");
}
