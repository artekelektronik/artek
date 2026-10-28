"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Label } from "@artek/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@artek/ui/components/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@artek/ui/components/sheet";
import { CapabilitySummary } from "@/components/capabilities-view";
import { FormStatus } from "@/components/form-status";
import { capabilitiesOf } from "@/lib/capabilities";
import { panelLabels, panelLevelLabels, roleLabels } from "@/lib/labels";
import type { Panel, PanelLevel, Role } from "@/lib/permissions";
import { updatePermissionsAction } from "./actions";

type Editable = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  roles: Role[];
  lokasyonIds: string[];
  panels: Partial<Record<Panel, PanelLevel>>;
};
type Choice = PanelLevel | "yok";

// The ⋯ at the end of a row: change what this person may see and do, with a live preview of the result.
export function PermissionsSheet({ user, lokasyon }: { user: Editable; lokasyon: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>(user.roles);
  const [lokasyonIds, setLokasyonIds] = useState<string[]>(user.lokasyonIds);
  const [panels, setPanels] = useState<Record<Panel, Choice>>({ musteri: user.panels.musteri ?? "yok", finans: user.panels.finans ?? "yok" });
  const [state, formAction, pending] = useActionState(updatePermissionsAction.bind(null, user.id), undefined);
  const admin = roles.includes("admin");
  const toggle = <T,>(list: T[], value: T, on: boolean) => (on ? [...new Set([...list, value])] : list.filter((v) => v !== value));

  // Reopening starts from what is saved, not from an abandoned edit.
  function onOpenChange(next: boolean) {
    if (next) {
      setRoles(user.roles);
      setLokasyonIds(user.lokasyonIds);
      setPanels({ musteri: user.panels.musteri ?? "yok", finans: user.panels.finans ?? "yok" });
    }
    setOpen(next);
  }

  const preview = capabilitiesOf(
    {
      roles,
      lokasyonIds,
      panels: admin ? Object.fromEntries(Object.entries(panels).filter(([, v]) => v !== "yok")) : {},
      active: user.active,
    },
    lokasyon,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`${user.name} için yetkileri düzenle`} title="Yetkileri düzenle">
          <MoreHorizontal />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{user.name}</SheetTitle>
          <SheetDescription>
            {user.email}. Yetkiyi artırmak veya kısıtlamak için işaretleri değiştirip kaydedin; değişiklik kişinin geçmişine yazılır.
          </SheetDescription>
        </SheetHeader>

        <form action={formAction} className="flex flex-col gap-5 px-4 pb-6">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Roller</legend>
            <div className="flex flex-wrap gap-4">
              {(Object.keys(roleLabels) as Role[]).map((r) => (
                <Label key={r} className="font-normal">
                  <Checkbox name="roles" value={r} checked={roles.includes(r)} onCheckedChange={(on) => setRoles(toggle(roles, r, on === true))} />{" "}
                  {roleLabels[r]}
                </Label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Lokasyon</legend>
            <div className="flex flex-wrap gap-4">
              {lokasyon.map((l) => (
                <Label key={l.id} className="font-normal">
                  <Checkbox
                    name="lokasyonIds"
                    value={l.id}
                    checked={lokasyonIds.includes(l.id)}
                    onCheckedChange={(on) => setLokasyonIds(toggle(lokasyonIds, l.id, on === true))}
                  />{" "}
                  {l.name}
                </Label>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">Mağaza ve depo sorumlusu yalnızca seçilen Lokasyon’da işlem yapar.</p>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Panel izinleri</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(panelLabels) as Panel[]).map((p) => (
                <Label key={p} className="flex-col items-stretch gap-1 font-normal">
                  {panelLabels[p]}
                  <Select value={admin ? panels[p] : "yok"} onValueChange={(v) => setPanels({ ...panels, [p]: v as Choice })} disabled={!admin}>
                    <SelectTrigger className="w-full" aria-label={panelLabels[p]}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(panelLevelLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <input type="hidden" name={p} value={admin ? panels[p] : "yok"} />
                </Label>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              {admin ? "Yönetici rolü tek başına panelleri açmaz; burada seçtiğiniz kadarını görür." : "Paneller yalnızca yöneticilere verilebilir."}
            </p>
          </fieldset>

          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Bu ayarlarla neleri görecek, neleri yapabilecek</h3>
            <CapabilitySummary capabilities={preview} compact />
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor…" : "Kaydet"}
            </Button>
            <Link href={`/kullanicilar/${user.id}`} className="text-sm underline-offset-4 hover:underline">
              Kişi sayfası: hesap ve geçmiş
            </Link>
            <FormStatus state={state} saved="Yetkiler kaydedildi." className="w-full" />
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
