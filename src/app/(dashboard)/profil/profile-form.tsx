"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileFormState } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ProfileFormState = { success: false };

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-xs text-red-600">{messages[0]}</p> : null;
}

type Props = {
  defaultValues: { name: string; email: string };
  roleLabel: string;
  department: string | null;
};

export function ProfileForm({ defaultValues, roleLabel, department }: Props) {
  const [state, formAction, pending] = useActionState(updateProfile, initial);
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-6 rounded-xl border border-emerald-100 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom complet</Label>
          <Input id="name" name="name" required autoComplete="name" defaultValue={defaultValues.name} />
          <FieldError messages={e.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" defaultValue={defaultValues.email} />
          <FieldError messages={e.email} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Rôle</Label>
          <Input id="role" value={roleLabel} disabled readOnly />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="department">Département</Label>
          <Input id="department" value={department ?? "—"} disabled readOnly />
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2">
          Le rôle et le département sont gérés par un administrateur.
        </p>
      </div>

      <fieldset className="space-y-4 border-t border-emerald-100 pt-5">
        <legend className="-mb-1 pr-2 text-sm font-medium text-slate-900">
          Changer le mot de passe <span className="font-normal text-slate-500">(optionnel)</span>
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" />
            <FieldError messages={e.currentPassword} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input id="newPassword" name="newPassword" type="password" minLength={8} autoComplete="new-password" />
            <FieldError messages={e.newPassword} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmation</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" />
            <FieldError messages={e.confirmPassword} />
          </div>
        </div>
      </fieldset>

      {state.message && (
        <p role={state.success ? "status" : "alert"} className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
