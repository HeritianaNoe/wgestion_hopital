import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/lib/rbac";

/** Charge toutes les permissions en base → Map "ROLE:resource" → boolean */
export async function loadPermissionOverrides(): Promise<Map<string, boolean>> {
  try {
    const rows = await prisma.rolePermission.findMany({
      select: { role: true, resource: true, canAccess: true },
    });
    const map = new Map<string, boolean>();
    for (const r of rows) {
      map.set(`${r.role}:${r.resource}`, r.canAccess);
    }
    return map;
  } catch {
    // Table absente ou DB down : fallback sur les défauts code
    return new Map();
  }
}
