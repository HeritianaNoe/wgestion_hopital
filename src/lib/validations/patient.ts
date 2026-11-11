import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const patientSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis"),
  lastName: z.string().trim().min(2, "Nom requis"),
  dob: z.coerce
    .date({ message: "Date de naissance invalide" })
    .max(new Date(), "La date ne peut pas être dans le futur"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Sexe requis" }),
  phone: z.preprocess(emptyToUndefined, z.string().trim().min(6, "Numéro trop court").optional()),
  emergencyContact: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  medicalHistory: z.preprocess(emptyToUndefined, z.string().trim().max(5000).optional()),
  status: z.enum(["ADMITTED", "DISCHARGED", "OUTPATIENT"]).default("OUTPATIENT"),
  litId: z.preprocess(emptyToUndefined, z.string().cuid().optional()),
  admittedAt: z.preprocess(emptyToUndefined, z.coerce.date({ message: "Date d'entrée invalide" }).optional()),
  dischargedAt: z.preprocess(emptyToUndefined, z.coerce.date({ message: "Date de sortie invalide" }).optional()),
}).superRefine((v, ctx) => {
  // +24 h de tolérance : le jour local de l'hôpital peut avoir une longueur d'avance sur UTC.
  const limit = Date.now() + 24 * 60 * 60 * 1000;
  const issue = (path: "admittedAt" | "dischargedAt", message: string) =>
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

  if (v.admittedAt && v.admittedAt.getTime() > limit) issue("admittedAt", "La date d'entrée ne peut pas être dans le futur");

  // Sans lit, seul le statut « Sorti » porte des dates de séjour.
  if (!v.litId && v.status === "DISCHARGED") {
    if (!v.admittedAt) issue("admittedAt", "Date d'entrée requise pour un patient sorti");
    if (v.dischargedAt && v.dischargedAt.getTime() > limit) issue("dischargedAt", "La date de sortie ne peut pas être dans le futur");
    if (v.admittedAt && v.dischargedAt && v.dischargedAt < v.admittedAt) {
      issue("dischargedAt", "La sortie ne peut pas précéder l'entrée");
    }
  }
});

export type PatientInput = z.infer<typeof patientSchema>;
