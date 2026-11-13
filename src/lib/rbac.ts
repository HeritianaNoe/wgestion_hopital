import type { NavIconKey } from "@/components/icons";

export type AppRole = "ADMIN" | "DIRECTOR" | "DOCTOR" | "NURSE" | "RECEPTIONIST";

/** Ressources gérées dans la matrice d'accès (Paramètres). */
export const ACCESS_RESOURCES = [
  { key: "dashboard", label: "Tableau de bord", pathPrefix: "/" },
  { key: "patients", label: "Patients (liste)", pathPrefix: "/patients" },
  { key: "patients.create", label: "Nouveau patient", pathPrefix: "/patients/new" },
  { key: "services", label: "Services", pathPrefix: "/services" },
  { key: "services.create", label: "Nouveau service", pathPrefix: "/services/new" },
  { key: "chambres", label: "Chambres", pathPrefix: "/chambres" },
  { key: "chambres.create", label: "Nouvelle chambre", pathPrefix: "/chambres/new" },
  { key: "lits", label: "Lits", pathPrefix: "/lits" },
  { key: "lits.create", label: "Nouveau lit", pathPrefix: "/lits/new" },
  { key: "staff", label: "Personnel", pathPrefix: "/staff" },
  { key: "parametres", label: "Paramètres (thème)", pathPrefix: "/parametres" },
  { key: "access", label: "Gestion des accès", pathPrefix: "/parametres#access" },
] as const;

export type ResourceKey = (typeof ACCESS_RESOURCES)[number]["key"];

/** Valeurs par défaut si aucune ligne en base (RolePermission). */
export const DEFAULT_ACCESS: Record<AppRole, Partial<Record<ResourceKey, boolean>>> = {
  ADMIN: {
    dashboard: true,
    patients: true,
    "patients.create": true,
    services: true,
    "services.create": true,
    chambres: true,
    "chambres.create": true,
    lits: true,
    "lits.create": true,
    staff: true,
    parametres: true,
    access: true,
  },
  DIRECTOR: {
    dashboard: true,
    patients: true,
    "patients.create": true,
    services: true,
    "services.create": true,
    chambres: true,
    "chambres.create": true,
    lits: true,
    "lits.create": true,
    staff: true,
    parametres: true,
    access: true,
  },
  DOCTOR: {
    dashboard: true,
    patients: true,
    "patients.create": false,
    services: true,
    "services.create": false,
    chambres: true,
    "chambres.create": false,
    lits: true,
    "lits.create": false,
    staff: false,
    parametres: true,
    access: false,
  },
  NURSE: {
    dashboard: true,
    patients: true,
    "patients.create": true,
    services: true,
    "services.create": false,
    chambres: true,
    "chambres.create": false,
    lits: true,
    "lits.create": false,
    staff: false,
    parametres: true,
    access: false,
  },
  RECEPTIONIST: {
    dashboard: true,
    patients: true,
    "patients.create": true,
    services: true,
    "services.create": false,
    chambres: true,
    "chambres.create": false,
    lits: true,
    "lits.create": false,
    staff: false,
    parametres: true,
    access: false,
  },
};

function resourceForPath(pathname: string): ResourceKey | null {
  const sorted = [...ACCESS_RESOURCES].sort((a, b) => b.pathPrefix.length - a.pathPrefix.length);
  for (const r of sorted) {
    if (r.key === "access") continue;
    if (r.pathPrefix === "/") {
      if (pathname === "/" || pathname === "") return "dashboard";
      continue;
    }
    if (pathname === r.pathPrefix || pathname.startsWith(r.pathPrefix + "/")) {
      return r.key as ResourceKey;
    }
  }
  return null;
}

export function canAccess(
  role: AppRole | undefined,
  pathname: string,
  overrides?: Map<string, boolean>,
): boolean {
  if (!role) return false;
  const resource = resourceForPath(pathname);
  if (!resource) return true;

  const key = `${role}:${resource}`;
  if (overrides?.has(key)) return overrides.get(key)!;

  return DEFAULT_ACCESS[role]?.[resource] ?? true;
}

export function canAccessResource(
  role: AppRole | undefined,
  resource: ResourceKey,
  overrides?: Map<string, boolean>,
): boolean {
  if (!role) return false;
  const key = `${role}:${resource}`;
  if (overrides?.has(key)) return overrides.get(key)!;
  return DEFAULT_ACCESS[role]?.[resource] ?? true;
}

export function canManageAccess(role: AppRole | undefined): boolean {
  return role === "ADMIN" || role === "DIRECTOR";
}

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconKey;
  roles?: AppRole[];
  resource?: ResourceKey;
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "general",
    label: "Général",
    items: [{ href: "/", label: "Tableau de bord", icon: "dashboard", resource: "dashboard" }],
  },
  {
    id: "clinical",
    label: "Clinique",
    items: [{ href: "/patients", label: "Patients", icon: "patients", resource: "patients" }],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    items: [
      { href: "/services", label: "Services", icon: "services", resource: "services" },
      { href: "/chambres", label: "Chambres", icon: "chambres", resource: "chambres" },
      { href: "/lits", label: "Lits", icon: "lits", resource: "lits" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [
      {
        href: "/staff",
        label: "Personnel",
        icon: "staff",
        roles: ["ADMIN", "DIRECTOR"],
        resource: "staff",
      },
    ],
  },
  {
    id: "system",
    label: "Système",
    items: [{ href: "/parametres", label: "Paramètres", icon: "settings", resource: "parametres" }],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export const ALL_ROLES: AppRole[] = ["ADMIN", "DIRECTOR", "DOCTOR", "NURSE", "RECEPTIONIST"];
