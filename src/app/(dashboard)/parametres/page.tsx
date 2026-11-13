import { cookies } from "next/headers";
import { auth } from "@/auth";
import { setThemeAction } from "@/lib/actions/settings";
import { DEFAULT_THEME, THEMES, THEME_COOKIE, isTheme, type ThemeKey } from "@/lib/theme";
import { canManageAccess, type AppRole } from "@/lib/rbac";
import { loadPermissionOverrides } from "@/lib/permissions";
import { AccessMatrix } from "./access-matrix";

export const dynamic = "force-dynamic";

/** Aperçu des couleurs : valeurs fixes pour montrer chaque thème quel que soit celui qui est actif. */
const SWATCH: Record<ThemeKey, { sidebar: string; primary: string; soft: string }> = {
  green: { sidebar: "#064e3b", primary: "#059669", soft: "#d1fae5" },
  blue: { sidebar: "#172554", primary: "#1e40af", soft: "#dbeafe" },
  gray: { sidebar: "#1f2937", primary: "#374151", soft: "#e5e7eb" },
  red: { sidebar: "#5f1616", primary: "#b91c1c", soft: "#fee2e2" },
};

export default async function ParametresPage() {
  const session = await auth();
  const role = session?.user?.role as AppRole | undefined;
  const canEditAccess = canManageAccess(role);

  const saved = (await cookies()).get(THEME_COOKIE)?.value;
  const current: ThemeKey = isTheme(saved) ? saved : DEFAULT_THEME;

  const overridesMap = await loadPermissionOverrides();
  const overrides: Record<string, boolean> = Object.fromEntries(overridesMap);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Paramètres</h1>
        <p className="text-sm text-slate-500">Personnalisez l&apos;apparence et les accès du personnel.</p>
      </div>

      <section className="rounded-xl border border-emerald-100 bg-white">
        <h2 className="border-b border-emerald-100 px-5 py-3 font-medium text-slate-900">Couleur principale</h2>
        <form action={setThemeAction} className="grid gap-4 p-5 sm:grid-cols-2">
          {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
            const active = key === current;
            const sw = SWATCH[key];
            return (
              <button
                key={key}
                type="submit"
                name="theme"
                value={key}
                aria-pressed={active}
                className={`rounded-xl border-2 p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  active ? "border-emerald-600 bg-emerald-50" : "border-slate-200 hover:border-emerald-300"
                }`}
              >
                <div className="flex h-24 overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="w-1/4" style={{ background: sw.sidebar }} />
                  <div className="flex-1 space-y-2 p-2.5">
                    <div className="h-2.5 w-1/2 rounded" style={{ background: sw.soft }} />
                    <div className="h-6 w-1/3 rounded" style={{ background: sw.primary }} />
                    <div className="h-2 w-3/4 rounded bg-slate-100" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{THEMES[key].label}</p>
                    <p className="text-xs text-slate-500">{THEMES[key].description}</p>
                  </div>
                  {active && (
                    <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-medium text-white">
                      Actif
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </form>
      </section>

      <p className="text-xs text-slate-500">
        Le thème est enregistré sur cet appareil (cookie) et appliqué à toutes les pages.
      </p>

      <AccessMatrix overrides={overrides} canEdit={canEditAccess} />
    </div>
  );
}
