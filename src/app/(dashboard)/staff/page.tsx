import { Suspense } from "react";
import Link from "next/link";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteStaff } from "@/lib/actions/staff";
import { PAGE_SIZE, fetchPage, first } from "@/lib/pagination";
import { DeleteButton } from "@/components/dashboard/delete-button";
import { EditLink } from "@/components/dashboard/edit-link";
import { ViewLink } from "@/components/dashboard/view-link";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { Pagination } from "@/components/dashboard/pagination";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  DIRECTOR: "Directeur",
  DOCTOR: "Médecin",
  NURSE: "Infirmier(e)",
  RECEPTIONIST: "Réceptionniste",
};

const ROLE_STYLE: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-800",
  DIRECTOR: "bg-indigo-100 text-indigo-800",
  DOCTOR: "bg-blue-100 text-blue-800",
  NURSE: "bg-teal-100 text-teal-800",
  RECEPTIONIST: "bg-amber-100 text-amber-800",
};

function buildWhere(q: string, role: Role | ""): Prisma.UserWhereInput {
  return {
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
    ...(role ? { role } : {}),
  };
}

/** Compteur affiché sous le titre (requête count séparée, streamée à part). */
async function StaffCount({ q, role }: { q: string; role: Role | "" }) {
  const total = await prisma.user.count({ where: buildWhere(q, role) });
  return (
    <p className="text-sm text-slate-500">
      {total} membre(s) du personnel{q || role ? " (filtré)" : ""}
    </p>
  );
}

async function StaffResults({ q, role, page: pageParam }: { q: string; role: Role | ""; page: string }) {
  const where = buildWhere(q, role);

  const { rows: users, total, page, totalPages } = await fetchPage(
    pageParam,
    () => prisma.user.count({ where }),
    (skip, take) =>
      prisma.user.findMany({
        where,
        orderBy: [{ role: "asc" }, { name: "asc" }, { id: "asc" }],
        // select : le hash du mot de passe n'est jamais chargé
        select: { id: true, name: true, email: true, role: true, department: true },
        skip,
        take,
      }),
  );
  const filtered = !!(q || role);

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-emerald-100 bg-emerald-50/50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Nom</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rôle</th>
              <th className="px-4 py-3 font-medium">Département</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {users.map((u) => {
              const del = deleteStaff.bind(null, u.id);
              return (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.department ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      <ViewLink href={`/staff/${u.id}`} title={`Voir ${u.name}`} />
                      <EditLink href={`/staff/${u.id}/edit`} title={`Modifier ${u.name}`} />
                      <DeleteButton action={del} confirmMessage={`Supprimer ${u.name} ?`} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            {filtered ? "Aucun membre ne correspond à ces filtres." : "Aucun personnel enregistré."}
          </p>
        )}
        <Pagination
          basePath="/staff"
          params={{ q, role }}
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
        />
      </div>
    </>
  );
}

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    updated?: string;
    q?: string | string[];
    role?: string | string[];
    page?: string | string[];
  }>;
}) {
  const sp = await searchParams;
  const q = first(sp.q).trim();
  const roleParam = first(sp.role);
  // valeur de rôle inconnue => ignorée
  const role: Role | "" = Object.prototype.hasOwnProperty.call(ROLE_LABEL, roleParam) ? (roleParam as Role) : "";
  const page = first(sp.page);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Personnel</h1>
          <Suspense key={`c|${q}|${role}`} fallback={<p className="h-5 text-sm text-slate-400">…</p>}>
            <StaffCount q={q} role={role} />
          </Suspense>
        </div>
        <Link
          href="/staff/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <IconPlus size={16} />
          Ajouter un membre
        </Link>
      </div>

      {sp.created && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Membre du personnel créé.
        </p>
      )}
      {sp.updated && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Modifications enregistrées.
        </p>
      )}

      <FilterBar action="/staff" active={!!(q || role)}>
        <div className="space-y-1">
          <Label htmlFor="q">Nom</Label>
          <Input id="q" name="q" defaultValue={q} placeholder="Rechercher un nom…" className="w-56" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="role">Rôle</Label>
          <select
            id="role"
            name="role"
            defaultValue={role}
            className="h-9 w-48 rounded-md border border-input bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <option value="">Tous les rôles</option>
            {Object.entries(ROLE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </FilterBar>

      <Suspense key={`${q}|${role}|${page}`} fallback={<TableSkeleton columns={5} />}>
        <StaffResults q={q} role={role} page={page} />
      </Suspense>
    </div>
  );
}
