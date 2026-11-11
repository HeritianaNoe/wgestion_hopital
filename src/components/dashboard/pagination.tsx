import Link from "next/link";
import { cn } from "@/lib/utils";

type Props = {
  basePath: string;
  /** Filtres à conserver dans les liens (q, lit, role...). Les valeurs vides sont ignorées. */
  params?: Record<string, string | undefined>;
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
};

function buildHref(basePath: string, params: Props["params"], page: number) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) if (v) qs.set(k, v);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/** 1 … 4 5 6 … 12 */
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  const set = new Set([1, totalPages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= totalPages));
  const sorted = [...set].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push("gap");
    items.push(n);
  });
  return items;
}

const cell = "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm";

export function Pagination({ basePath, params, page, totalPages, total, pageSize }: Props) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-100 px-4 py-3">
      <p className="text-xs text-slate-500">
        Affichage {from}–{to} sur {total}
      </p>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          {page > 1 ? (
            <Link href={buildHref(basePath, params, page - 1)} className={cn(cell, "text-emerald-800 hover:bg-emerald-50")}>
              Précédent
            </Link>
          ) : (
            <span className={cn(cell, "text-slate-300")}>Précédent</span>
          )}

          {pageItems(page, totalPages).map((it, i) =>
            it === "gap" ? (
              <span key={`gap-${i}`} className={cn(cell, "text-slate-400")}>
                …
              </span>
            ) : (
              <Link
                key={it}
                href={buildHref(basePath, params, it)}
                aria-current={it === page ? "page" : undefined}
                className={cn(cell, it === page ? "bg-emerald-600 font-medium text-white" : "text-emerald-800 hover:bg-emerald-50")}
              >
                {it}
              </Link>
            ),
          )}

          {page < totalPages ? (
            <Link href={buildHref(basePath, params, page + 1)} className={cn(cell, "text-emerald-800 hover:bg-emerald-50")}>
              Suivant
            </Link>
          ) : (
            <span className={cn(cell, "text-slate-300")}>Suivant</span>
          )}
        </nav>
      )}
    </div>
  );
}
