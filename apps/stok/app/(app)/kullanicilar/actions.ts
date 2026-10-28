"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { runAction, type ActionState } from "@/lib/action-result";
import { text } from "@/lib/form-data";
import type { Role } from "@/lib/permissions";
import {
  deactivateUser,
  endSessions,
  inviteUser,
  reactivateUser,
  sendPasswordLinkTo,
  updateAccess,
  updatePanels,
} from "@/lib/user-admin";

function accessFrom(formData: FormData) {
  return {
    roles: formData.getAll("roles").map(String) as Role[],
    lokasyonIds: formData.getAll("lokasyonIds").map(String),
  };
}

export async function inviteUserAction(_previous: ActionState, formData: FormData): Promise<ActionState> {
  let id = "";
  const state = await runAction(async () => {
    id = (await inviteUser(await headers(), { email: text(formData, "email"), name: text(formData, "name"), ...accessFrom(formData) })).id;
  });
  if (state.error) return state;
  redirect(`/kullanicilar/${id}?davet=gonderildi`);
}

export async function updateAccessAction(id: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () => updateAccess(await headers(), id, accessFrom(formData)));
  revalidatePath("/kullanicilar");
  revalidatePath(`/kullanicilar/${id}`);
  return state;
}

export async function updatePanelsAction(id: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const state = await runAction(async () =>
    updatePanels(await headers(), id, { musteri: text(formData, "musteri") as never, finans: text(formData, "finans") as never }),
  );
  revalidatePath("/kullanicilar");
  revalidatePath(`/kullanicilar/${id}`);
  return state;
}

// The ⋯ editor on the Kullanıcılar table: roles, Lokasyon and panels in one save. Roles go first, because a panel
// can only be given to an admin; without the admin role the panels are cleared.
export async function updatePermissionsAction(id: string, _previous: ActionState, formData: FormData): Promise<ActionState> {
  const access = accessFrom(formData);
  const admin = access.roles.includes("admin");
  const state = await runAction(async () => {
    const requestHeaders = await headers();
    await updateAccess(requestHeaders, id, access);
    await updatePanels(requestHeaders, id, {
      musteri: admin ? (text(formData, "musteri") as never) : "yok",
      finans: admin ? (text(formData, "finans") as never) : "yok",
    });
  });
  revalidatePath("/kullanicilar");
  revalidatePath(`/kullanicilar/${id}`);
  return state;
}

async function userAction(id: string, work: (headers: Headers) => Promise<void>): Promise<ActionState> {
  const state = await runAction(async () => work(await headers()));
  revalidatePath(`/kullanicilar/${id}`);
  revalidatePath("/kullanicilar");
  return state;
}

export async function sendPasswordLinkAction(id: string): Promise<ActionState> {
  return userAction(id, (h) => sendPasswordLinkTo(h, id));
}

export async function endSessionsAction(id: string): Promise<ActionState> {
  return userAction(id, (h) => endSessions(h, id));
}

export async function deactivateUserAction(id: string): Promise<ActionState> {
  return userAction(id, (h) => deactivateUser(h, id));
}

export async function reactivateUserAction(id: string): Promise<ActionState> {
  return userAction(id, (h) => reactivateUser(h, id));
}
