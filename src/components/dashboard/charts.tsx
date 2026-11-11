/** Graphiques SVG/CSS rendus côté serveur : aucune dépendance, couleurs héritées du thème (currentColor). */

export type LineSeries = { name: string; values: number[]; className: string; area?: boolean };

export function LineChart({ labels, titles, series }: { labels: string[]; titles?: string[]; series: LineSeries[] }) {
  const W = 600, H = 260, L = 34, R = 12, T = 12, B = 28;
  const n = labels.length;
  const max = Math.max(0, ...series.flatMap((s) => s.values));
  const step = Math.max(1, Math.ceil(max / 4));
  const yMax = step * 4; // 4 intervalles, graduations entières (on compte des personnes)
  const x = (i: number) => (n <= 1 ? L + (W - L - R) / 2 : L + (i * (W - L - R)) / (n - 1));
  const y = (v: number) => T + (H - T - B) * (1 - v / yMax);
  const every = Math.ceil(n / 7);
  const path = (v: number[]) => v.map((val, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(val).toFixed(1)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={series.map((s) => `${s.name} : ${s.values.reduce((a, b) => a + b, 0)}`).join(", ")}
    >
      {[0, 1, 2, 3, 4].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t * step)} y2={y(t * step)} className="stroke-slate-200" strokeWidth={1} />
          <text x={L - 8} y={y(t * step) + 4} textAnchor="end" fontSize={11} className="fill-slate-500">
            {t * step}
          </text>
        </g>
      ))}

      {labels.map((label, i) =>
        i % every === 0 ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} className="fill-slate-500">
            {label}
          </text>
        ) : null,
      )}

      {series.map((s) => (
        <g key={s.name} className={s.className}>
          {s.area && n > 1 && (
            <path d={`${path(s.values)} L${x(n - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} fill="currentColor" fillOpacity={0.08} />
          )}
          <path d={path(s.values)} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {s.values.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={3.5} fill="white" stroke="currentColor" strokeWidth={2}>
              <title>{`${titles?.[i] ?? labels[i]} — ${s.name} : ${v}`}</title>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  );
}

export function ChartLegend({ items }: { items: { name: string; total: number; className: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
      {items.map((it) => (
        <li key={it.name} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full bg-current ${it.className}`} />
          {it.name} : <span className="font-medium tabular-nums text-slate-900">{it.total}</span>
        </li>
      ))}
    </ul>
  );
}

/** Barres horizontales : lisibles même avec des noms de services longs. */
export function BarChart({ data, emptyLabel = "Aucune donnée." }: { data: { label: string; value: number }[]; emptyLabel?: string }) {
  if (data.length === 0) return <p className="py-8 text-center text-sm text-slate-500">{emptyLabel}</p>;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <ul className="space-y-3">
      {data.map((d) => (
        <li key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-32 shrink-0 truncate text-slate-700" title={d.label}>
            {d.label}
          </span>
          <div
            className="h-5 flex-1 overflow-hidden rounded bg-emerald-50"
            role="img"
            aria-label={`${d.label} : ${d.value}`}
          >
            <div className="h-full rounded bg-emerald-600" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
          <span className="w-8 shrink-0 text-right font-medium tabular-nums text-slate-900">{d.value}</span>
        </li>
      ))}
    </ul>
  );
}
