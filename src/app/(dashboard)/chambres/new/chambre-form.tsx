"use client";

import { useActionState, useState } from "react";
import { createChambre, type ChambreFormState } from "@/lib/actions/chambre";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ChambreFormState = { success: false };
const selectClass =
  "h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400";

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-xs text-red-600">{messages[0]}</p> : null;
}

export function ChambreForm({ services }: { services: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(createChambre, initial);
  const [type, setType] = useState("STANDARD");
  const e = state.errors ?? {};
  const needsService = type === "STANDARD";

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-emerald-100 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="number">N° chambre</Label>
          <Input id="number" name="number" required maxLength={10} placeholder="ex. 111" />
          <FieldError messages={e.number} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="floor">Étage</Label>
          <Input id="floor" name="floor" type="number" min={0} max={50} step={1} required defaultValue={1} />
          <FieldError messages={e.floor} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select id="type" name="type" value={type} onChange={(ev) => setType(ev.target.value)} className={selectClass}>
            <option value="STANDARD">Standard</option>
            <option value="VIP">VIP</option>
            <option value="ICU">Soins intensifs (ICU)</option>
          </select>
          <FieldError messages={e.type} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="serviceId">Service</Label>
          <select
            id="serviceId"
            name="serviceId"
            defaultValue=""
            disabled={!needsService}
            required={needsService}
            className={selectClass}
          >
            <option value="" disabled={needsService}>
              {needsService ? "Choisir…" : "Aucun (VIP / ICU hors service)"}
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {needsService && services.length === 0 && (
            <p className="text-xs text-amber-700">Aucun service n&apos;existe : créez-en un avant d&apos;ajouter une chambre standard.</p>
          )}
          <FieldError messages={e.serviceId} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="beds">Nombre de lits à créer</Label>
          <Input id="beds" name="beds" type="number" min={0} max={20} step={1} defaultValue={1} className="w-32" />
          <p className="text-xs text-slate-500">Les lits sont numérotés automatiquement (ex. 111-1, 111-2). 0 = aucun lit pour l&apos;instant.</p>
          <FieldError messages={e.beds} />
        </div>
      </div>

      {state.message && (
        <p role="alert" className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Créer la chambre"}
      </Button>
    </form>
  );
}
