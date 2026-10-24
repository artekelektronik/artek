import { Badge } from "@artek/ui/components/badge";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Label } from "@artek/ui/components/label";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/lib/permissions";

// Roles and the Lokasyon a user may act in; mağaza and depo sorumlusu act only in these.
export function AccessFields({
  roles = [],
  lokasyonIds = [],
  lokasyon,
}: {
  roles?: Role[];
  lokasyonIds?: string[];
  lokasyon: { id: string; name: string }[];
}) {
  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Roller</legend>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(roleLabels) as Role[]).map((role) => (
            <Label key={role} className="font-normal">
              <Checkbox name="roles" value={role} defaultChecked={roles.includes(role)} /> {roleLabels[role]}
            </Label>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">Lokasyon</legend>
        <div className="flex flex-wrap gap-4">
          {lokasyon.map((l) => (
            <Label key={l.id} className="font-normal">
              <Checkbox name="lokasyonIds" value={l.id} defaultChecked={lokasyonIds.includes(l.id)} /> {l.name}
            </Label>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">Mağaza ve depo sorumlusu yalnızca seçilen Lokasyon&apos;da işlem yapar.</p>
      </fieldset>
    </>
  );
}

export function UserStatus({ active, invited }: { active: boolean; invited: boolean }) {
  if (!active) return <Badge variant="destructive">Devre dışı</Badge>;
  if (invited) return <Badge variant="outline">Davet bekliyor</Badge>;
  return <Badge variant="secondary">Etkin</Badge>;
}
