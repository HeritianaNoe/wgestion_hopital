import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logoutAction } from "@/lib/actions/auth";
import { NAV_GROUPS, canAccessResource, type AppRole, type ResourceKey } from "@/lib/rbac";
import { ROLE_LABEL } from "@/lib/roles";
import { loadPermissionOverrides } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { NAV_ICONS, IconHospital, IconLogout, IconUser } from "@/components/icons";
import { MobileNav } from "@/components/dashboard/mobile-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session!.user;
  const role = user.role as AppRole;

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, department: true },
  });
  const displayName = me?.name ?? user.name ?? "";
  const department = me ? me.department : user.department;

  const overrides = await loadPermissionOverrides();

  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (i.roles && !i.roles.includes(role)) return false;
      if (i.resource && !canAccessResource(role, i.resource as ResourceKey, overrides)) return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);

  const roleLabel = `${ROLE_LABEL[role] ?? role}${department ? ` · ${department}` : ""}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-emerald-900 text-emerald-50 md:flex">
        <div className="flex items-center gap-2.5 border-b border-emerald-800/80 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <IconHospital size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Gestion Hôpital</p>
            <p className="text-[11px] text-emerald-300/90">Système de gestion</p>
          </div>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = NAV_ICONS[item.icon];
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-emerald-100 transition hover:bg-emerald-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <Icon size={17} className="shrink-0 opacity-90" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-emerald-800/80 p-3">
          <Link
            href="/profil"
            title="Modifier mon profil"
            className="flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white">
              <IconUser size={18} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-white">{displayName}</span>
              <span className="block truncate text-[11px] text-emerald-300/90">{roleLabel}</span>
            </span>
          </Link>
        </div>
      </aside>

      {/* Contenu multi-écran : sidebar desktop + drawer mobile */}
      <div className="flex min-h-screen min-w-0 flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-emerald-100 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <MobileNav groups={groups} displayName={displayName} roleLabel={roleLabel} />
            <div className="min-w-0 md:hidden">
              <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
              <p className="truncate text-xs text-slate-500">{roleLabel}</p>
            </div>
            <div className="hidden md:block" />
          </div>
          <form action={logoutAction}>
            <Button variant="outline" size="sm" type="submit" className="gap-1.5">
              <IconLogout size={15} />
              <span className="hidden sm:inline">Se déconnecter</span>
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
