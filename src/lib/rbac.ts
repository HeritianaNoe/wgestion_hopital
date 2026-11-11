import type { NavIconKey } from "@/components/icons";

export type AppRole = "ADMIN" | "DOCTOR" | "NURSE" | "RECEPTIONIST";

/** First matching prefix wins. Routes not listed are open to any signed-in user. */
const ROUTE_RULES: { prefix: string; roles: AppRole[] }[] = [
  { prefix: "/admin", roles: ["ADMIN"] },
  { prefix: "/staff", roles: ["ADMIN"] },
  { prefix: "/services/new", roles: ["ADMIN"] },
  { prefix: "/chambres/new", roles: ["ADMIN"] },
  { prefix: "/lits/new", roles: ["ADMIN"] },
  { prefix: "/patients/new", roles: ["ADMIN", "RECEPTIONIST", "NURSE"] },
];

export function canAccess(role: AppRole | undefined, pathname: string): boolean {
  const rule = ROUTE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + "/"));
  if (!rule) return true;
  return !!role && rule.roles.includes(role);
}

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconKey;
  roles?: AppRole[];
};

export type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

/** Menu sidebar — zaraina araka ny sokajy (tsy asiana « Nouveau patient ») */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: "general",
    label: "Général",
    items: [{ href: "/", label: "Tableau de bord", icon: "dashboard" }],
  },
  {
    id: "clinical",
    label: "Clinique",
    items: [{ href: "/patients", label: "Patients", icon: "patients" }],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    items: [
      { href: "/services", label: "Services", icon: "services" },
      { href: "/chambres", label: "Chambres", icon: "chambres" },
      { href: "/lits", label: "Lits", icon: "lits" },
    ],
  },
  {
    id: "admin",
    label: "Administration",
    items: [{ href: "/staff", label: "Personnel", icon: "staff", roles: ["ADMIN"] }],
  },
  {
    id: "system",
    label: "Système",
    items: [{ href: "/parametres", label: "Paramètres", icon: "settings" }],
  },
];

/** Flat list (compat) */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
