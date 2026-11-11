export const PAGE_SIZE = 10;

type Param = string | string[] | undefined;

/** Valeur simple d'un searchParam (la première si c'est un tableau). */
export function first(v: Param): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/** Calcule skip/take en bornant la page demandée dans [1, totalPages]. */
export function paginate(total: number, requested: Param, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const n = Number.parseInt(first(requested), 10);
  const page = Number.isFinite(n) ? Math.min(Math.max(n, 1), totalPages) : 1;
  return { page, totalPages, skip: (page - 1) * pageSize, take: pageSize };
}

/**
 * Charge une page ET le total EN PARALLÈLE (un seul aller-retour DB au lieu de deux).
 * Cas rare : si la page demandée dépasse le dernier numéro, on relit la page bornée.
 */
export async function fetchPage<T>(
  requested: Param,
  count: () => Promise<number>,
  find: (skip: number, take: number) => Promise<T[]>,
  pageSize = PAGE_SIZE,
) {
  const n = Number.parseInt(first(requested), 10);
  const wanted = Number.isFinite(n) ? Math.min(Math.max(n, 1), 100_000) : 1; // borne : évite un skip démesuré
  const [total, rows] = await Promise.all([count(), find((wanted - 1) * pageSize, pageSize)]);
  const { page, totalPages, skip, take } = paginate(total, requested, pageSize);
  return { total, page, totalPages, rows: page === wanted ? rows : await find(skip, take) };
}
