import { Suspense } from "react";
import Link from "next/link";
import Form from "next/form";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { countOf, sumAll } from "@/lib/stats";
import { first, fetchPage } from "@/lib/pagination";
import { todayInHospitalTz } from "@/lib/dates";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChart, ChartLegend, LineChart } from "@/components/dashboard/charts";
import { Pagination } from "@/components/dashboard/pagination";
import { ChartSkeleton, ListSkeleton, StatsSkeleton } from "@/components/dashboard/skeletons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { IconActivity, IconDoor, IconPatients, IconPlus, IconSearch } from "@/components/icons";

export const dynamic = "force-dynamic"; // always-fresh hospital figures

const RECENT_PAGE_SIZE = 5;

const STATUS_LABEL = { ADMITTED: "Hospitalisé", DISCHARGED: "Sorti", OUTPATIENT: "Externe" } as const;
const STATUS_STYLE = {
  ADMITTED: "bg-emerald-100 text-emerald-800",
  DISCHARGED: "bg-slate-100 text-slate-600",
  OUTPATIENT: "bg-teal-100 text-teal-800",
} as const;

type Range = "week" | "month";
const RANGES: { key: Range; label: string; days: number }[] = [
  { key: "week", label: "7 jours", days: 7 },
  { key: "month", label: "30 jours", days: 30 },
];

/** KPI : 4 requêtes en parallèle (au lieu de 7) grâce aux groupBy. */
async function Stats() {
  const [patientGroups, litGroups, roomsAvailable, roomsTotal] = await Promise.all([
    prisma.patient.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lit.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.chambre.count({ where: { lits: { some: { status: "AVAILABLE" } } } }),
    prisma.chambre.count(),
  ]);

  const totalPatients = sumAll(patientGroups);
  const admitted = countOf(patientGroups, "ADMITTED");
  const bedsOccupied = countOf(litGroups, "OCCUPIED");
  const bedsMaintenance = countOf(litGroups, "MAINTENANCE");
  const usableBeds = sumAll(litGroups) - bedsMaintenance; // beds under maintenance cannot be assigned
  const occupancy = usableBeds > 0 ? Math.round((bedsOccupied / usableBeds) * 100) : 0;

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      <StatCard
        label="Patients enregistrés"
        value={totalPatients}
        hint={`${admitted} actuellement hospitalisés`}
        icon={<IconPatients size={20} />}
      />
      <StatCard
        label="Taux d'occupation des lits"
        value={`${occupancy}%`}
        progress={occupancy}
        hint={`${bedsOccupied} lits occupés sur ${usableBeds} utilisables`}
        icon={<IconActivity size={20} />}
      />
      <StatCard
        label="Chambres avec lit libre"
        value={roomsAvailable}
        hint={`sur ${roomsTotal} chambres`}
        icon={<IconDoor size={20} />}
      />
    </section>
  );
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Courbe : admissions (admittedAt) et sorties (dischargedAt) par jour sur 7 ou 30 jours. */
async function AdmissionsChart({ range, q, page }: { range: Range; q: string; page: string }) {
  const days = RANGES.find((r) => r.key === range)!.days;
  const today = todayInHospitalTz();
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const [adm, dis] = await Promise.all([
    prisma.patient.groupBy({
      by: ["admittedAt"],
      where: { admittedAt: { gte: start, lte: today } },
      _count: { _all: true },
    }),
    prisma.patient.groupBy({
      by: ["dischargedAt"],
      where: { dischargedAt: { gte: start, lte: today } },
      _count: { _all: true },
    }),
  ]);

  const admMap = new Map(adm.map((r) => [r.admittedAt ? dayKey(r.admittedAt) : "", r._count._all]));
  const disMap = new Map(dis.map((r) => [r.dischargedAt ? dayKey(r.dischargedAt) : "", r._count._all]));

  const labels: string[] = [];
  const titles: string[] = [];
  const admissions: number[] = [];
  const discharges: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const k = dayKey(d);
    labels.push(`${k.slice(8, 10)}/${k.slice(5, 7)}`);
    titles.push(d.toLocaleDateString("fr-FR", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }));
    admissions.push(admMap.get(k) ?? 0);
    discharges.push(disMap.get(k) ?? 0);
  }
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  return (
    <section className="rounded-xl border border-emerald-100 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 px-5 py-3">
        <h2 className="font-medium text-slate-900">Admissions et sorties</h2>
        <nav aria-label="Période" className="flex gap-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={buildHref({ range: r.key === "week" ? undefined : r.key, q, page })}
              aria-current={r.key === range ? "true" : undefined}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                r.key === range ? "bg-emerald-600 text-white" : "text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="space-y-3 p-5">
        <ChartLegend
          items={[
            { name: "Admissions", total: sum(admissions), className: "text-emerald-600" },
            { name: "Sorties", total: sum(discharges), className: "text-amber-500" },
          ]}
        />
        <LineChart
          labels={labels}
          titles={titles}
          series={[
            { name: "Admissions", values: admissions, className: "text-emerald-600", area: true },
            { name: "Sorties", values: discharges, className: "text-amber-500" },
          ]}
        />
      </div>
    </section>
  );
}

/** Barres : patients hospitalisés (avec un lit) par service. VIP et soins intensifs n'ont pas de service. */
async function DepartmentsChart() {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const counts = await Promise.all([
    ...services.map((s) => prisma.patient.count({ where: { lit: { is: { chambre: { serviceId: s.id } } } } })),
    prisma.patient.count({ where: { lit: { is: { chambre: { serviceId: null } } } } }),
  ]);

  const data = [
    ...services.map((s, i) => ({ label: s.name, value: counts[i] })),
    { label: "VIP / Soins intensifs", value: counts[services.length] },
  ].sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "fr"));

  return (
    <section className="rounded-xl border border-emerald-100 bg-white">
      <div className="border-b border-emerald-100 px-5 py-3">
        <h2 className="font-medium text-slate-900">Patients par service</h2>
        <p className="text-xs text-slate-500">Patients ayant un lit assigné</p>
      </div>
      <div className="p-5">
        <BarChart data={data} emptyLabel="Aucun service enregistré." />
      </div>
    </section>
  );
}

function buildHref({ range, q, page }: { range?: string; q?: string; page?: string }) {
  const qs = new URLSearchParams();
  if (range) qs.set("range", range);
  if (q) qs.set("q", q);
  if (page && page !== "1") qs.set("page", page);
  const s = qs.toString();
  return s ? `/?${s}` : "/";
}

function nameWhere(q: string): Prisma.PatientWhereInput {
  // chaque mot doit se retrouver dans le prénom OU le nom
  const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5);
  return tokens.length
    ? {
        AND: tokens.map((t) => ({
          OR: [
            { firstName: { contains: t, mode: "insensitive" } },
            { lastName: { contains: t, mode: "insensitive" } },
          ],
        })),
      }
    : {};
}

async function RecentPatients({ q, range, page: pageParam }: { q: string; range: Range; page: string }) {
  const where = nameWhere(q);
  const { rows: recent, total, page, totalPages } = await fetchPage(
    pageParam,
    () => prisma.patient.count({ where }),
    (skip, take) =>
      prisma.patient.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          lit: { select: { bedNumber: true, chambre: { select: { number: true } } } },
        },
        skip,
        take,
      }),
    RECENT_PAGE_SIZE,
  );

  return (
    <>
      {recent.length === 0 ? (
        <p className="px-5 py-8 text-sm text-slate-500">
          {q ? "Aucun patient ne correspond à cette recherche." : "Aucun patient pour le moment. Enregistrez le premier avec le bouton ci-dessus."}
        </p>
      ) : (
        <ul className="divide-y divide-emerald-50">
          {recent.map((p) => (
            <li key={p.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <Link href={`/patients/${p.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                  {p.lastName.toUpperCase()} {p.firstName}
                </Link>
                <p className="text-xs text-slate-500">
                  {p.lit ? `Chambre ${p.lit.chambre.number}, lit ${p.lit.bedNumber}` : "Sans lit"}
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status]}`}>
                {STATUS_LABEL[p.status]}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Pagination
        basePath="/"
        params={{ q, range: range === "week" ? undefined : range }}
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={RECENT_PAGE_SIZE}
      />
    </>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; q?: string | string[]; range?: string | string[]; page?: string | string[] }>;
}) {
  const [sp, session] = await Promise.all([searchParams, auth()]);
  const canAdmit = ["ADMIN", "RECEPTIONIST", "NURSE"].includes(session!.user.role);
  const q = first(sp.q).trim();
  const range: Range = first(sp.range) === "month" ? "month" : "week";
  const page = first(sp.page);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tableau de bord</h1>
          <p className="text-sm text-slate-500">Situation actuelle de l&apos;établissement</p>
        </div>
        {canAdmit && (
          <Link href="/patients/new" className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <IconPlus size={16} />
            Enregistrer un patient
          </Link>
        )}
      </div>

      {sp.created && (
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          Patient enregistré.
        </p>
      )}

      {/* Chaque bloc est streamé séparément : le titre s'affiche immédiatement, puis les KPI, graphiques et la liste */}
      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense key={range} fallback={<ChartSkeleton />}>
          <AdmissionsChart range={range} q={q} page={page} />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <DepartmentsChart />
        </Suspense>
      </div>

      <section className="rounded-xl border border-emerald-100 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 px-5 py-3">
          <h2 className="font-medium text-slate-900">Derniers patients</h2>
          {/* next/form : recherche côté client, la période du graphique est conservée */}
          <Form action="/" className="flex items-center gap-2">
            {range === "month" && <input type="hidden" name="range" value="month" />}
            <Input name="q" defaultValue={q} placeholder="Rechercher un patient…" aria-label="Rechercher un patient" className="w-52" />
            <Button type="submit" size="sm" className="gap-1.5">
              <IconSearch size={14} />
              Rechercher
            </Button>
            {q && (
              <Link href={buildHref({ range: range === "week" ? undefined : range })} className="text-sm text-emerald-800 underline-offset-2 hover:underline">
                Réinitialiser
              </Link>
            )}
          </Form>
        </div>
        <Suspense key={`${q}|${page}`} fallback={<ListSkeleton rows={RECENT_PAGE_SIZE} bare />}>
          <RecentPatients q={q} range={range} page={page} />
        </Suspense>
      </section>
    </div>
  );
}
