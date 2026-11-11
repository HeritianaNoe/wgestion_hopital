import { Suspense } from "react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deletePatient } from "@/lib/actions/patient";
import { formatDate } from "@/lib/dates";
import { PAGE_SIZE, fetchPage, first } from "@/lib/pagination";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { ViewLink } from "@/components/dashboard/view-link";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { Pagination } from "@/components/dashboard/pagination";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { ADMITTED: "Hospitalisé", DISCHARGED: "Sorti", OUTPATIENT: "Externe" } as const;
const STATUS_STYLE = {
  ADMITTED: "bg-emerald-100 text-emerald-800",
  DISCHARGED: "bg-slate-100 text-slate-600",
  OUTPATIENT: "bg-teal-100 text-teal-800",
} as const;
const GENDER_LABEL = { MALE: "H", FEMALE: "F", OTHER: "A" } as const;

function buildWhere(q: string, litQ: string): Prisma.PatientWhereInput {
  // Nom : chaque mot doit se retrouver dans le prénom OU le nom (« rivo andria » trouve Rivo Andrianasolo).
  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5);
  const and: Prisma.PatientWhereInput[] = tokens.map((t) => ({
    OR: [
      { firstName: { contains: t, mode: "insensitive" } },
      { lastName: { contains: t, mode: "insensitive" } },
    ],
  }));
  // Lit : n° de lit (« 101-2 ») ou n° de chambre (« 101 »).
  if (litQ) {
    and.push({
      lit: {
        is: {
          OR: [
            { bedNumber: { contains: litQ, mode: "insensitive" } },
            { chambre: { number: { contains: litQ, mode: "insensitive" } } },
          ],
        },
      },
    });
  }
  return and.length ? { AND: and } : {};
}

/** Partie lente (requêtes DB) : streamée dans un <Suspense> pour que le reste de la page s'affiche tout de suite. */
async function PatientsResults({ q, litQ, page: pageParam }: { q: string; litQ: string; page: string }) {
  const where = buildWhere(q, litQ);
  const { rows: patients, total, page, totalPages } = await fetchPage(
    pageParam,
    () => prisma.patient.count({ where }),
    (skip, take) =>
      prisma.patient.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        // select : on ne charge ni les antécédents médicaux (texte long) ni les champs inutiles
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dob: true,
          gender: true,
          status: true,
          admittedAt: true,
          dischargedAt: true,
          lit: { select: { bedNumber: true, chambre: { select: { number: true } } } },
        },
        skip,
        take,
      }),
  );
  const filtered = !!(q || litQ);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-emerald-100 bg-emerald-50/50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Sexe</th>
              <th className="px-4 py-3 font-medium">Lit</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Entrée</th>
              <th className="px-4 py-3 font-medium">Sortie</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {patients.map((p) => {
              const del = deletePatient.bind(null, p.id);
              return (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {p.lastName.toUpperCase()} {p.firstName}
                    </p>
                    <p className="text-xs text-slate-500">Né(e) le {formatDate(p.dob)}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{GENDER_LABEL[p.gender]}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {p.lit ? `${p.lit.chambre.number} / ${p.lit.bedNumber}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.admittedAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(p.dischargedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <ViewLink href={`/patients/${p.id}`} title={`Voir ${p.lastName} ${p.firstName}`} />
                      <DeleteButton action={del} confirmMessage={`Supprimer ${p.lastName} ${p.firstName} ?`} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {patients.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            {filtered ? "Aucun patient ne correspond à ces filtres." : "Aucun patient. Enregistrez le premier."}
          </p>
        )}
        <Pagination
          basePath="/patients"
          params={{ q, lit: litQ }}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
        />
      </div>
    </>
  );
}

/** Compteur affiché sous le titre (requête count séparée, streamée à part). */
async function PatientsCount({ q, litQ }: { q: string; litQ: string }) {
  const total = await prisma.patient.count({ where: buildWhere(q, litQ) });
  return (
    <p className="text-sm text-slate-500">
      {total} patient(s) {q || litQ ? "trouvé(s)" : "enregistré(s)"}
    </p>
  );
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; q?: string | string[]; lit?: string | string[]; page?: string | string[] }>;
}) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const litQ = first(sp.lit).trim();
  const page = first(sp.page);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
          <Suspense key={`c|${q}|${litQ}`} fallback={<p className="h-5 text-sm text-slate-400">…</p>}>
            <PatientsCount q={q} litQ={litQ} />
          </Suspense>
        </div>
        <Link
          href="/patients/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <IconPlus size={16} />
          Nouveau patient
        </Link>
      </div>

      {sp.deleted && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Patient supprimé.
        </p>
      )}

      <FilterBar action="/patients" active={!!(q || litQ)}>
        <div className="space-y-1">
          <Label htmlFor="q">Nom</Label>
          <Input id="q" name="q" defaultValue={q} placeholder="Nom ou prénom…" className="w-56" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="lit">Lit</Label>
          <Input id="lit" name="lit" defaultValue={litQ} placeholder="N° lit ou chambre…" className="w-48" />
        </div>
      </FilterBar>

      {/* key : le squelette réapparaît à chaque changement de filtre ou de page */}
      <Suspense key={`${q}|${litQ}|${page}`} fallback={<TableSkeleton columns={7} />}>
        <PatientsResults q={q} litQ={litQ} page={page} />
      </Suspense>
    </div>
  );
}
