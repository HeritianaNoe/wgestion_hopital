import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateLit } from "@/lib/actions/lit";
import { LitForm } from "../../lit-form";

export default async function EditLitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lit, chambres] = await Promise.all([
    prisma.lit.findUnique({
      where: { id },
      include: { patient: true, chambre: true },
    }),
    prisma.chambre.findMany({ orderBy: { number: "asc" } }),
  ]);
  if (!lit) notFound();

  const bound = updateLit.bind(null, id);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Modifier le lit {lit.bedNumber}</h1>
      <p className="mb-6 text-sm text-slate-500">
        Chambre {lit.chambre.number}
        {lit.patient
          ? ` · Occupé par ${lit.patient.lastName.toUpperCase()} ${lit.patient.firstName}`
          : " · Aucun patient"}
      </p>
      <LitForm
        action={bound}
        chambres={chambres.map((c) => ({ id: c.id, label: `${c.number} (ét. ${c.floor}, ${c.type})` }))}
        defaultValues={{
          bedNumber: lit.bedNumber,
          chambreId: lit.chambreId,
          status: lit.status,
        }}
        hasPatient={!!lit.patient}
      />
    </div>
  );
}
