"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { THEME_COOKIE, isTheme } from "@/lib/theme";
import {
  ACCESS_RESOURCES,
  ALL_ROLES,
  canManageAccess,
  type AppRole,
} from "@/lib/rbac";

/** Enregistre le thème dans un cookie (1 an). Tout utilisateur connecté peut changer son thème. */
export async function setThemeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");

  const theme = formData.get("theme");
  if (!isTheme(theme)) return;

  const store = await cookies();
  store.set(THEME_COOKIE, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  });

  revalidatePath("/", "layout");
}

export type AccessFormState = {
  success: boolean;
  message?: string;
};

/**
 * Enregistre la matrice d'accès (checkboxes).
 * ADMIN et DIRECTOR uniquement.
 */
export async function saveAccessMatrixAction(
  _prev: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const session = await auth();
  if (!session?.user) return { success: false, message: "Non authentifié." };
  if (!canManageAccess(session.user.role as AppRole)) {
    return { success: false, message: "Seuls l'Administrateur et le Directeur peuvent modifier les accès." };
  }

  try {
    const ops: Promise<unknown>[] = [];

    for (const role of ALL_ROLES) {
      for (const res of ACCESS_RESOURCES) {
        const field = `access_${role}_${res.key}`;
        const checked = formData.get(field) === "on" || formData.get(field) === "true";

        let canAccess = checked;
        if (res.key === "access" && (role === "ADMIN" || role === "DIRECTOR")) {
          canAccess = true;
        }

        ops.push(
          prisma.rolePermission.upsert({
            where: {
              role_resource: { role: role as AppRole, resource: res.key },
            },
            create: {
              role: role as AppRole,
              resource: res.key,
              canAccess,
            },
            update: { canAccess },
          }),
        );
      }
    }

    await Promise.all(ops);
    revalidatePath("/", "layout");
    revalidatePath("/parametres");
    return { success: true, message: "Accès du personnel enregistrés." };
  } catch (e) {
    console.error(e);
    return {
      success: false,
      message: "Erreur lors de l'enregistrement. Vérifiez que la migration role_permissions est appliquée.",
    };
  }
}
