/** Lit un compteur dans le résultat d'un groupBy({ by: ["status"], _count: { _all: true } }). */
export function countOf<S extends string>(groups: { status: S; _count: { _all: number } }[], status: S): number {
  return groups.find((g) => g.status === status)?._count._all ?? 0;
}

export function sumAll(groups: { _count: { _all: number } }[]): number {
  return groups.reduce((n, g) => n + g._count._all, 0);
}
