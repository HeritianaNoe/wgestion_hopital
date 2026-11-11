"use client";

import { useActionState } from "react";
import { createService, type ServiceFormState } from "@/lib/actions/service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initial: ServiceFormState = { success: false };

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-xs text-red-600">{messages[0]}</p> : null;
}

export function ServiceForm() {
  const [state, formAction, pending] = useActionState(createService, initial);
  const e = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-emerald-100 bg-white p-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nom du service</Label>
        <Input id="name" name="name" required minLength={2} maxLength={60} placeholder="ex. Neurologie" />
        <FieldError messages={e.name} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">
          Description <span className="font-normal text-slate-500">(optionnel)</span>
        </Label>
        <Textarea id="description" name="description" rows={3} maxLength={300} />
        <FieldError messages={e.description} />
      </div>

      {state.message && (
        <p role="alert" className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
          {state.message}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Créer le service"}
      </Button>
    </form>
  );
}
