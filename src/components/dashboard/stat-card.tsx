import { createElement, type ComponentType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  progress?: number; // 0–100
  /** Icône dans une pastille à droite : un élément (<IconBed size={20} />) ou directement le composant (IconBed). */
  icon?: ReactNode | ComponentType<{ size?: number }>;
};

/** Toutes les cartes KPI ont le même style : fond blanc, bordure légère, pastille d'icône. */
export function StatCard({ label, value, hint, progress, icon }: Props) {
  return (
    <div className={cn("rounded-xl border border-emerald-100 bg-white p-5")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
          >
            {typeof icon === "function" ? createElement(icon, { size: 20 }) : icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-4xl font-semibold tabular-nums text-slate-900">{value}</p>
      {progress !== undefined && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
          <div className="h-full rounded-full bg-teal-500" style={{ width: `${progress}%` }} />
        </div>
      )}
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
