import { Skeleton } from "@/components/ui/skeleton";

function Busy({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">Chargement…</span>
      {children}
    </div>
  );
}

/** Tableau en cours de chargement (en-tête + lignes). */
export function TableSkeleton({ columns = 5, rows = 10 }: { columns?: number; rows?: number }) {
  const cols = Array.from({ length: columns });
  return (
    <Busy className="space-y-3">
      <Skeleton className="h-4 w-44" />
      <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white">
        <div className="flex gap-4 border-b border-emerald-100 bg-emerald-50/50 px-4 py-3.5">
          {cols.map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1 bg-emerald-100" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 border-b border-emerald-50 px-4 py-3.5 last:border-0">
            {cols.map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </Busy>
  );
}

/** Grille de cartes (chambres). */
export function CardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Busy className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-emerald-100 bg-white p-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      ))}
    </Busy>
  );
}

/** Les 3 cartes KPI du tableau de bord. */
export function StatsSkeleton() {
  return (
    <Busy className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-emerald-100 bg-white p-5">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </Busy>
  );
}

/** Liste « Derniers patients ». */
export function ListSkeleton({ rows = 6, bare = false }: { rows?: number; bare?: boolean }) {
  return (
    <Busy className={bare ? undefined : "rounded-xl border border-emerald-100 bg-white"}>
      {!bare && (
        <div className="border-b border-emerald-100 px-5 py-3.5">
          <Skeleton className="h-4 w-36" />
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border-b border-emerald-50 px-5 py-3.5 last:border-0">
          <div className="w-1/2 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </Busy>
  );
}

/** Squelette neutre d'une page (titre + bloc) : utilisé par défaut pour tout le dashboard. */
export function PageSkeleton() {
  return (
    <Busy className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4 rounded-xl border border-emerald-100 bg-white p-6">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-32" />
      </div>
    </Busy>
  );
}

/** Carte de graphique en cours de chargement. */
export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <Busy className={`space-y-4 rounded-xl border border-emerald-100 bg-white p-5 ${className ?? ""}`}>
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-52 w-full" />
    </Busy>
  );
}

/** Lignes seules de la liste « Derniers patients » (sans cadre ni titre). */
export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Busy>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between border-b border-emerald-50 px-5 py-3.5 last:border-0">
          <div className="w-1/2 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </Busy>
  );
}

