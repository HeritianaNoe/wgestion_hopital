"use client";

import { useActionState } from "react";
import type { StaffFormState } from "@/lib/actions/staff";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: StaffFormState = { success: false };
const selectClass =
  "h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-xs text-red-600">{messages[0]}</p> : null;
}

type Props = {
  action: (prev: StaffFormState, formData: FormData) => Promise<StaffFormState>;
  defaultValues?: {
    name?: string;
    email?: string;
    role?: string;
    department?: string | null;
  };
  isEdit?: boolean;
};

export function StaffForm({ action, defaultValues, isEdit }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-emerald-100 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom complet</Label>
          <Input id="name" name="name" required defaultValue={defaultValues?.name} />
          <FieldError messages={e.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required defaultValue={defaultValues?.email} />
          <FieldError messages={e.email} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Rôle</Label>
          <select id="role" name="role" required defaultValue={defaultValues?.role ?? ""} className={selectClass}>
            <option value="" disabled>Choisir…</option>
            <option value="ADMIN">Administrateur</option>
            <option value="DOCTOR">Médecin</option>
            <option value="NURSE">Infirmier(e)</option>
            <option value="RECEPTIONIST">Réceptionniste</option>
          </select>
          <FieldError messages={e.role} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="department">Département</Label>
          <Input id="department" name="department" defaultValue={defaultValues?.department ?? ""} />
          <FieldError messages={e.department} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="password">
            Mot de passe {isEdit && <span className="font-normal text-slate-500">(laisser vide pour ne pas changer)</span>}
          </Label>
          <Input id="password" name="password" type="password" minLength={isEdit ? undefined : 8} required={!isEdit} />
          <FieldError messages={e.password} />
        </div>
      </div>

      {state.message && (
        <p role="alert" className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : isEdit ? "Enregistrer les modifications" : "Créer le membre"}
      </Button>
    </form>
  );
}
