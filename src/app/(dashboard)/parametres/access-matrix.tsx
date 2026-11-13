"use client";

import { useActionState } from "react";
import {
  ACCESS_RESOURCES,
  ALL_ROLES,
  DEFAULT_ACCESS,
  type AppRole,
  type ResourceKey,
} from "@/lib/rbac";
import { ROLE_LABEL } from "@/lib/roles";
import { saveAccessMatrixAction, type AccessFormState } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";

const initial: AccessFormState = { success: false };

type Props = {
  /** Map "ROLE:resource" → canAccess from DB */
  overrides: Record<string, boolean>;
  canEdit: boolean;
};

function isChecked(role: AppRole, resource: ResourceKey, overrides: Record<string, boolean>): boolean {
  const k = `${role}:${resource}`;
  if (k in overrides) return overrides[k];
  return DEFAULT_ACCESS[role]?.[resource] ?? true;
}

export function AccessMatrix({ overrides, canEdit }: Props) {
  const [state, formAction, pending] = useActionState(saveAccessMatrixAction, initial);

  return (
    <section id="access" className="rounded-xl border border-emerald-100 bg-white">
      <div className="border-b border-emerald-100 px-5 py-3">
        <h2 className="font-medium text-slate-900">Accès du personnel</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Cochez les modules autorisés pour chaque rôle.
          {canEdit
            ? " Réservé à l'Administrateur et au Directeur."
            : " Lecture seule — seuls Admin et Directeur peuvent modifier."}
        </p>
      </div>

      <form action={formAction} className="p-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-100 text-slate-600">
                <th className="px-2 py-2 font-medium">Module</th>
                {ALL_ROLES.map((role) => (
                  <th key={role} className="px-2 py-2 text-center font-medium">
                    <span className="block text-xs leading-tight">{ROLE_LABEL[role]}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {ACCESS_RESOURCES.map((res) => (
                <tr key={res.key} className="hover:bg-slate-50/60">
                  <td className="px-2 py-2.5 font-medium text-slate-800">{res.label}</td>
                  {ALL_ROLES.map((role) => {
                    const locked =
                      res.key === "access" && (role === "ADMIN" || role === "DIRECTOR");
                    const checked = locked || isChecked(role, res.key, overrides);
                    const name = `access_${role}_${res.key}`;
                    return (
                      <td key={role} className="px-2 py-2.5 text-center">
                        <input
                          type="checkbox"
                          name={name}
                          value="on"
                          defaultChecked={checked}
                          disabled={!canEdit || locked}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-60"
                          aria-label={`${ROLE_LABEL[role]} — ${res.label}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {state.message && (
          <p
            role="alert"
            className={`mt-4 text-sm ${state.success ? "text-emerald-700" : "text-red-600"}`}
          >
            {state.message}
          </p>
        )}

        {canEdit && (
          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer les accès"}
            </Button>
          </div>
        )}
      </form>
    </section>
  );
}
