/** Fuseau de l'hôpital : sert à déterminer « aujourd'hui » côté serveur (surchargeable via APP_TIMEZONE). */
const TZ = process.env.APP_TIMEZONE ?? "Indian/Antananarivo";

/** Aujourd'hui (jour calendaire de l'hôpital) à 00:00 UTC, prêt à être stocké dans une colonne DATE. */
export function todayInHospitalTz(): Date {
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()); // YYYY-MM-DD
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Les colonnes DATE sont lues à minuit UTC : on formate en UTC pour ne jamais décaler d'un jour. */
export function formatDate(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString("fr-FR", { timeZone: "UTC" }) : "—";
}

/** Date + heure dans le fuseau de l'hôpital (pour les colonnes timestamp : createdAt, updatedAt). */
export function formatDateTime(d: Date | null | undefined): string {
  return d ? d.toLocaleString("fr-FR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }) : "—";
}
