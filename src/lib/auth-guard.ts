import { auth } from "@/auth";
import type { AppRole } from "@/lib/rbac";

/** Use at the top of every Server Action: middleware alone is not enough. */
export async function requireRole(allowed: AppRole[]) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");
  if (!allowed.includes(session.user.role)) throw new Error("FORBIDDEN");
  return session;
}
