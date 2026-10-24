"use client";

import { useActionState } from "react";
import { Button } from "@artek/ui/components/button";
import { Checkbox } from "@artek/ui/components/checkbox";
import { Label } from "@artek/ui/components/label";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/lib/permissions";
import { setRecipientRolesAction } from "./actions";
import { FormStatus } from "@/components/form-status";

export function RecipientsForm({ roles }: { roles: Role[] }) {
  const [state, formAction, pending] = useActionState(setRecipientRolesAction, undefined);
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-4">
      {(Object.keys(roleLabels) as Role[]).map((role) => (
        <Label key={role} className="font-normal">
          <Checkbox name="roles" value={role} defaultChecked={roles.includes(role)} /> {roleLabels[role]}
        </Label>
      ))}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        Kaydet
      </Button>
      <FormStatus state={state} saved="Alıcılar kaydedildi." className="w-full" />
    </form>
  );
}
