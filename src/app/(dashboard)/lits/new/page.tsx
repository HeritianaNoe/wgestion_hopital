import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createLit } from "@/lib/actions/lit";
import { LitForm } from "../lit-form";

export const dynamic = "force-dynamic";

export default async function NewLitPage() {
  const chambres = await prisma.chambre.findMany({ orderBy: { number: "asc" } });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Nouveau lit</h1>
      <p className="mb-6 text-sm text-slate-500">Ajouter un lit dans une chambre existante.</p>

      {chambres.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Aucune chambre n&apos;existe.{" "}
          <Link href="/chambres/new" className="font-medium underline">
            Créez d&apos;abord une chambre
          </Link>
          .
        </p>
      ) : (
        <LitForm
          action={createLit}
          submitLabel="Créer le lit"
          chambres={chambres.map((c) => ({ id: c.id, label: `${c.number} (ét. ${c.floor}, ${c.type})` }))}
          defaultValues={{ bedNumber: "", chambreId: chambres[0].id, status: "AVAILABLE" }}
        />
      )}
    </div>
  );
}
