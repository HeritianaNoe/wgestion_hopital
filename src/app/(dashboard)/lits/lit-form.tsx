"use client";

import { useActionState } from "react";
import type { LitFormState } from "@/lib/actions/lit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: LitFormState = { success: false };
const selectClass =
  "h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-xs text-red-600">{messages[0]}</p> : null;
}

type Props = {
  action: (prev: LitFormState, formData: FormData) => Promise<LitFormState>;
  chambres: { id: string; label: string }[];
  defaultValues: { bedNumber: string; chambreId: string; status: string };
  hasPatient?: boolean;
  submitLabel?: string;
};

export function LitForm({ action, chambres, defaultValues, hasPatient, submitLabel = "Enregistrer" }: Props) {
  const [state, formAction, pending] = useActionState(action, initial);
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-emerald-100 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="bedNumber">N° lit</Label>
          <Input id="bedNumber" name="bedNumber" required defaultValue={defaultValues.bedNumber} />
          <FieldError messages={e.bedNumber} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chambreId">Chambre</Label>
          <select
            id="chambreId"
            name="chambreId"
            required
            defaultValue={defaultValues.chambreId}
            className={selectClass}
          >
            {chambres.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError messages={e.chambreId} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="status">Statut</Label>
          <select id="status" name="status" required defaultValue={defaultValues.status} className={selectClass}>
            <option value="AVAILABLE">Disponible</option>
            <option value="OCCUPIED" disabled={!hasPatient && defaultValues.status !== "OCCUPIED"}>
              Occupé{!hasPatient ? " (patient requis)" : ""}
            </option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
          <FieldError messages={e.status} />
          {hasPatient && (
            <p className="text-xs text-amber-700">
              Passer en Disponible ou Maintenance libérera le patient (statut Sorti).
            </p>
          )}
        </div>
      </div>

      {state.message && (
        <p role="alert" className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </form>
  );
}
