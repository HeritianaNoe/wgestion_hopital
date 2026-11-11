"use client";

import { useActionState, useState } from "react";
import { createPatient, type PatientFormState } from "@/lib/actions/patient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initial: PatientFormState = { success: false };
const selectClass =
  "h-9 w-full rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

function FieldError({ messages }: { messages?: string[] }) {
  return messages?.length ? <p className="text-xs text-red-600">{messages[0]}</p> : null;
}

export function PatientForm({ beds }: { beds: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(createPatient, initial);
  const e = state.errors ?? {};
  const [litId, setLitId] = useState("");
  const [status, setStatus] = useState("OUTPATIENT");

  // Champs de dates affichés selon le cas : lit attribué => entrée ; sans lit + « Sorti » => entrée + sortie.
  const discharged = !litId && status === "DISCHARGED";
  const showAdmission = !!litId || discharged;

  return (
    <form action={formAction} className="space-y-5 rounded-xl border border-emerald-100 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" name="firstName" required />
          <FieldError messages={e.firstName} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" name="lastName" required />
          <FieldError messages={e.lastName} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dob">Date de naissance</Label>
          <Input id="dob" name="dob" type="date" required />
          <FieldError messages={e.dob} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gender">Sexe</Label>
          <select id="gender" name="gender" required defaultValue="" className={selectClass}>
            <option value="" disabled>Choisir…</option>
            <option value="FEMALE">Femme</option>
            <option value="MALE">Homme</option>
            <option value="OTHER">Autre</option>
          </select>
          <FieldError messages={e.gender} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone</Label>
          <Input id="phone" name="phone" type="tel" />
          <FieldError messages={e.phone} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="emergencyContact">Contact d&apos;urgence</Label>
          <Input id="emergencyContact" name="emergencyContact" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="medicalHistory">Antécédents médicaux</Label>
        <Textarea id="medicalHistory" name="medicalHistory" rows={4} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="litId">Lit à attribuer</Label>
          <select id="litId" name="litId" value={litId} onChange={(ev) => setLitId(ev.target.value)} className={selectClass}>
            <option value="">Aucun (patient externe)</option>
            {beds.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
          {beds.length === 0 && <p className="text-xs text-slate-500">Aucun lit disponible actuellement.</p>}
          <FieldError messages={e.litId} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Statut (sans lit)</Label>
          <select id="status" name="status" value={status} onChange={(ev) => setStatus(ev.target.value)} disabled={!!litId} className={selectClass}>
            <option value="OUTPATIENT">Externe</option>
            <option value="DISCHARGED">Sorti</option>
          </select>
        </div>
        {showAdmission && (
          <div className="space-y-1.5">
            <Label htmlFor="admittedAt">Date d&apos;entrée</Label>
            <Input id="admittedAt" name="admittedAt" type="date" required={discharged} />
            {!discharged && <p className="text-xs text-slate-500">Vide = aujourd&apos;hui.</p>}
            <FieldError messages={e.admittedAt} />
          </div>
        )}
        {discharged && (
          <div className="space-y-1.5">
            <Label htmlFor="dischargedAt">Date de sortie</Label>
            <Input id="dischargedAt" name="dischargedAt" type="date" />
            <p className="text-xs text-slate-500">Vide = aujourd&apos;hui.</p>
            <FieldError messages={e.dischargedAt} />
          </div>
        )}
      </div>

      {state.message && (
        <p role="alert" className={state.success ? "text-sm text-emerald-700" : "text-sm text-red-600"}>{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer le patient"}
      </Button>
    </form>
  );
}
