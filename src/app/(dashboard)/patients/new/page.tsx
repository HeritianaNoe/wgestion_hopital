import { prisma } from "@/lib/prisma";
import { PatientForm } from "./patient-form";

export default async function NewPatientPage() {
  const beds = await prisma.lit.findMany({
    where: { status: "AVAILABLE", patient: null },
    select: { id: true, bedNumber: true, chambre: { select: { number: true, type: true } } },
    orderBy: [{ chambre: { number: "asc" } }, { bedNumber: "asc" }],
  });

  const options = beds.map((b) => ({
    id: b.id,
    label: `Chambre ${b.chambre.number} (${b.chambre.type}), lit ${b.bedNumber}`,
  }));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Nouveau patient</h1>
      <p className="mb-6 text-sm text-slate-500">Choisir un lit admet automatiquement le patient.</p>
      <PatientForm beds={options} />
    </div>
  );
}
