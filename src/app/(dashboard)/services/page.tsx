import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { IconPlus } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const [sp, session, services] = await Promise.all([
    searchParams,
    auth(),
    prisma.service.findMany({
      orderBy: { name: "asc" },
      include: { chambres: { select: { _count: { select: { lits: true } } } } },
    }),
  ]);
  const isAdmin = session?.user.role === "ADMIN";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Services</h1>
          <p className="text-sm text-slate-500">{services.length} service(s)</p>
        </div>
        {isAdmin && (
          <Link
            href="/services/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <IconPlus size={16} />
            Nouveau service
          </Link>
        )}
      </div>

      {sp.created && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Service créé.
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-emerald-100 bg-emerald-50/50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Service</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium text-right">Chambres</th>
              <th className="px-4 py-3 font-medium text-right">Lits</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-50">
            {services.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.description ?? "—"}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">{s.chambres.length}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                  {s.chambres.reduce((n, c) => n + c._count.lits, 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && <p className="px-4 py-8 text-center text-sm text-slate-500">Aucun service enregistré.</p>}
      </div>
    </div>
  );
}
