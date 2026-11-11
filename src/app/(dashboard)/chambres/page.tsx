import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { IconDoor, IconPlus, IconServices } from "@/components/icons";

export const dynamic = "force-dynamic";

const TYPE_LABEL = { VIP: "VIP", STANDARD: "Standard", ICU: "Soins intensifs" } as const;
const TYPE_STYLE = {
  VIP: "bg-amber-100 text-amber-800",
  STANDARD: "bg-slate-100 text-slate-700",
  ICU: "bg-red-100 text-red-800",
} as const;

type ChambreRow = Awaited<ReturnType<typeof getChambres>>[number];

function getChambres() {
  return prisma.chambre.findMany({
    orderBy: [{ floor: "asc" }, { number: "asc" }],
    // select : uniquement ce qui est affiché (pas de dossier patient complet)
    select: {
      id: true,
      number: true,
      floor: true,
      type: true,
      serviceId: true,
      lits: {
        select: { id: true, bedNumber: true, status: true, patient: { select: { lastName: true } } },
        orderBy: { bedNumber: "asc" },
      },
    },
  });
}

function ChambreCard({ c }: { c: ChambreRow }) {
  const occupied = c.lits.filter((l) => l.status === "OCCUPIED").length;
  const available = c.lits.filter((l) => l.status === "AVAILABLE").length;
  return (
    <div className="rounded-xl border border-emerald-100 bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Chambre {c.number}</p>
          <p className="text-xs text-slate-500">Étage {c.floor}</p>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[c.type]}`}>
          {TYPE_LABEL[c.type]}
        </span>
      </div>
      <div className="mt-3 flex gap-3 text-xs text-slate-600">
        <span>{c.lits.length} lit(s)</span>
        <span className="text-emerald-700">{available} libre(s)</span>
        <span className="text-amber-700">{occupied} occupé(s)</span>
      </div>
      <ul className="mt-3 space-y-1 border-t border-emerald-50 pt-3">
        {c.lits.map((l) => (
          <li key={l.id} className="flex items-center justify-between text-xs">
            <span className="text-slate-700">{l.bedNumber}</span>
            <span
              className={
                l.status === "AVAILABLE"
                  ? "text-emerald-600"
                  : l.status === "OCCUPIED"
                    ? "text-amber-600"
                    : "text-slate-400"
              }
            >
              {l.status === "AVAILABLE"
                ? "Libre"
                : l.status === "OCCUPIED"
                  ? l.patient
                    ? `${l.patient.lastName}`
                    : "Occupé"
                  : "Maintenance"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ChambresPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const [sp, session, services, chambres] = await Promise.all([
    searchParams,
    auth(),
    prisma.service.findMany({ orderBy: { name: "asc" } }),
    getChambres(),
  ]);
  const isAdmin = session?.user.role === "ADMIN";

  // Chambres rattachées à un service, puis VIP / ICU (aucun service).
  const byService = services
    .map((s) => ({ service: s, chambres: chambres.filter((c) => c.serviceId === s.id) }))
    .filter((g) => g.chambres.length > 0);
  const hors = chambres.filter((c) => !c.serviceId);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Chambres</h1>
        {isAdmin && (
          <Link
            href="/chambres/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <IconPlus size={16} />
            Nouvelle chambre
          </Link>
        )}
      </div>

      {sp.created && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Chambre créée.
        </p>
      )}

      <section className="grid grid-cols-2 gap-4">
        <StatCard label="Chambres" value={chambres.length} icon={<IconDoor size={20} />} />
        <StatCard label="Services" value={services.length} icon={<IconServices size={20} />} />
      </section>

      {byService.map(({ service, chambres: list }) => (
        <section key={service.id} className="space-y-3">
          <div className="flex items-baseline justify-between border-b border-emerald-100 pb-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{service.name}</h2>
              {service.description && <p className="text-xs text-slate-500">{service.description}</p>}
            </div>
            <span className="text-xs text-slate-500">{list.length} chambre(s)</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((c) => (
              <ChambreCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      ))}

      {hors.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between border-b border-emerald-100 pb-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Hors service</h2>
              <p className="text-xs text-slate-500">Chambres VIP et soins intensifs (rattachées à aucun service)</p>
            </div>
            <span className="text-xs text-slate-500">{hors.length} chambre(s)</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hors.map((c) => (
              <ChambreCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
