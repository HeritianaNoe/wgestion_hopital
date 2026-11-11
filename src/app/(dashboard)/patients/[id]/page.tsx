import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { IconDownload } from "@/components/icons";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { ADMITTED: "Hospitalisé", DISCHARGED: "Sorti", OUTPATIENT: "Externe" } as const;
const STATUS_STYLE = {
  ADMITTED: "bg-emerald-100 text-emerald-800",
  DISCHARGED: "bg-slate-100 text-slate-600",
  OUTPATIENT: "bg-teal-100 text-teal-800",
} as const;
const GENDER_LABEL = { MALE: "Homme", FEMALE: "Femme", OTHER: "Autre" } as const;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.patient.findUnique({
    where: { id },
    include: { lit: { select: { bedNumber: true, chambre: { select: { number: true, floor: true } } } } },
  });
  if (!p) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/patients" className="text-sm text-emerald-700 hover:underline">
          ← Retour aux patients
        </Link>
        <div className="mt-2 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">
            {p.lastName.toUpperCase()} {p.firstName}
          </h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>
            {STATUS_LABEL[p.status]}
          </span>
        </div>
      </div>

      <section className="rounded-xl border border-emerald-100 bg-white">
        <h2 className="border-b border-emerald-100 px-5 py-3 font-medium text-slate-900">Identité</h2>
        <dl className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Date de naissance">{formatDate(p.dob)}</Field>
          <Field label="Sexe">{GENDER_LABEL[p.gender]}</Field>
          <Field label="Téléphone">{p.phone ?? "—"}</Field>
          <Field label="Contact d'urgence">{p.emergencyContact ?? "—"}</Field>
        </dl>
      </section>

      <section className="rounded-xl border border-emerald-100 bg-white">
        <h2 className="border-b border-emerald-100 px-5 py-3 font-medium text-slate-900">Hospitalisation</h2>
        <dl className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Chambre / lit">
            {p.lit ? `Chambre ${p.lit.chambre.number} (étage ${p.lit.chambre.floor}) / lit ${p.lit.bedNumber}` : "—"}
          </Field>
          <Field label="Statut">{STATUS_LABEL[p.status]}</Field>
          <Field label="Date d'entrée">{formatDate(p.admittedAt)}</Field>
          <Field label="Date de sortie">{formatDate(p.dischargedAt)}</Field>
        </dl>
      </section>

      <section className="rounded-xl border border-emerald-100 bg-white">
        <h2 className="border-b border-emerald-100 px-5 py-3 font-medium text-slate-900">Antécédents médicaux</h2>
        <p className="whitespace-pre-wrap p-5 text-sm text-slate-700">{p.medicalHistory?.trim() || "Aucun antécédent renseigné."}</p>
      </section>

      <div className="flex justify-end">
        {/* <a> et non <Link> : téléchargement direct, sans préchargement */}
        <a
          href={`/patients/${p.id}/pdf`}
          download
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <IconDownload size={16} />
          Télécharger en PDF
        </a>
      </div>
    </div>
  );
}
