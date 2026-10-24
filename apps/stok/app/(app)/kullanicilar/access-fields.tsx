import { Badge } from "@artek/ui/components/badge";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Label } from "@artek/ui/components/label";
import { roleLabels, userStatus, userStatusLabels } from "@/lib/labels";
import type { Role } from "@/lib/permissions";

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
  const status = userStatus({ active, invited });
  const variant = { pasif: "destructive", davet: "outline", etkin: "secondary" } as const;
  return <Badge variant={variant[status]}>{userStatusLabels[status]}</Badge>;
}
