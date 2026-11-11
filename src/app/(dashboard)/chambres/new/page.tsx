import { prisma } from "@/lib/prisma";
import { ChambreForm } from "./chambre-form";

export const dynamic = "force-dynamic";

export default async function NewChambrePage() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Nouvelle chambre</h1>
      <p className="mb-6 text-sm text-slate-500">
        Une chambre standard appartient à un service ; les chambres VIP et soins intensifs n&apos;en ont pas.
      </p>
      <ChambreForm services={services} />
    </div>
  );
}
