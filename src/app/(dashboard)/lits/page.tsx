import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteLit } from "@/lib/actions/lit";
import { PAGE_SIZE, fetchPage, first } from "@/lib/pagination";
import { countOf, sumAll } from "@/lib/stats";
import { StatCard } from "@/components/dashboard/stat-card";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { EditLink } from "@/components/dashboard/edit-link";
import { Pagination } from "@/components/dashboard/pagination";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { IconBed, IconCheckCircle, IconPatients, IconPlus, IconWrench } from "@/components/icons";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { AVAILABLE: "Disponible", OCCUPIED: "Occupé", MAINTENANCE: "Maintenance" } as const;
const STATUS_STYLE = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  OCCUPIED: "bg-amber-100 text-amber-800",
  MAINTENANCE: "bg-slate-100 text-slate-600",
} as const;

async function LitsResults({ page: pageParam }: { page: string }) {
  // 3 requêtes en parallèle : compteurs par statut, total (pour la pagination) et la page de lits.
  // Les compteurs portent sur TOUS les lits, pas seulement sur la page affichée.
  const [byStatus, pageData] = await Promise.all([
    prisma.lit.groupBy({ by: ["status"], _count: { _all: true } }),
    fetchPage(
      pageParam,
      () => prisma.lit.count(),
      (skip, take) =>
        prisma.lit.findMany({
          orderBy: [{ chambre: { number: "asc" } }, { bedNumber: "asc" }, { id: "asc" }],
          select: {
            id: true,
            bedNumber: true,
            status: true,
            chambre: { select: { number: true, floor: true, type: true } },
            patient: { select: { id: true } }, // sert seulement à savoir si le lit est occupé
          },
          skip,
          take,
        }),
    ),
  ]);
  const { rows: lits, total, page, totalPages } = pageData;

  return (
    <>
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total des lits" value={sumAll(byStatus)} icon={<IconBed size={20} />} />
        <StatCard label="Libres" value={countOf(byStatus, "AVAILABLE")} icon={<IconCheckCircle size={20} />} />
        <StatCard label="Occupés" value={countOf(byStatus, "OCCUPIED")} icon={<IconPatients size={20} />} />
        <StatCard label="En maintenance" value={countOf(byStatus, "MAINTENANCE")} icon={<IconWrench size={20} />} />
      </section>

      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-emerald-100 bg-emerald-50/50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">N° lit</th>
              <th className="px-4 py-3 font-medium">Chambre</th>
              <th className="px-4 py-3 font-medium">Étage</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {lits.map((l) => {
              const del = deleteLit.bind(null, l.id);
              return (
                <tr key={l.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{l.bedNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{l.chambre.number}</td>
                  <td className="px-4 py-3 text-slate-600">{l.chambre.floor}</td>
                  <td className="px-4 py-3 text-slate-600">{l.chambre.type}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[l.status]}`}>
                      {STATUS_LABEL[l.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <EditLink href={`/lits/${l.id}/edit`} title={`Modifier ${l.bedNumber}`} />
                      {!l.patient ? (
                        <DeleteButton
                          action={del}
                          confirmMessage={`Supprimer le lit ${l.bedNumber} ?`}
                          dialogTitle="Supprimer ce lit"
                        />
                      ) : (
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center text-slate-300"
                          title="Libérez le patient avant de supprimer"
                        >
                          —
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {lits.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun lit enregistré.</p>}
        <Pagination basePath="/lits" page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} />
      </div>
    </>
  );
}

export default async function LitsPage({
  searchParams,
}: {
  searchParams: Promise<{ updated?: string; created?: string; page?: string | string[] }>;
}) {
  const [sp, session] = await Promise.all([searchParams, auth()]);
  const isAdmin = session?.user.role === "ADMIN";
  const page = first(sp.page);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Lits</h1>
        {isAdmin && (
          <Link
            href="/lits/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <IconPlus size={16} />
            Nouveau lit
          </Link>
        )}
      </div>

      {sp.created && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Lit créé.
        </p>
      )}
      {sp.updated && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Lit mis à jour.
        </p>
      )}

      <Suspense key={page} fallback={<TableSkeleton columns={6} />}>
        <LitsResults page={page} />
      </Suspense>
    </div>
  );
}
