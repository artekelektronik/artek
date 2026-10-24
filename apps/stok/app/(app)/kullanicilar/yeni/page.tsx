import { headers } from "next/headers";
import { NoAccess } from "@/components/no-access";
import { loadActor } from "@/lib/guard";
import { listLokasyon } from "@/lib/lokasyon";
import { can } from "@/lib/permissions";
import { AccessFields } from "../access-fields";
import { inviteUserAction } from "../actions";
import { InviteForm } from "../user-forms";

export const metadata = { title: "Kullanıcı davet et | Artek Stok" };

export default async function InviteUserPage() {
  // The page is only a form; inviteUser itself enforces the permission.
  if (!can(await loadActor(await headers()), "users.manage")) return <NoAccess />;
  const lokasyon = await listLokasyon();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Kullanıcı davet et</h1>
      <p className="text-muted-foreground max-w-xl text-sm">
        Kullanıcıya şifresini kendisinin belirleyeceği bir bağlantı e-postayla gider; bağlantı 7 gün geçerlidir. Şifreyi kimse, yöneticiler de, göremez.
      </p>
      <InviteForm action={inviteUserAction}>
        <AccessFields lokasyon={lokasyon} />
      </InviteForm>
    </div>
  );
}
