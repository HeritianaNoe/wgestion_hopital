import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const chambreSchema = z
  .object({
    number: z.string().trim().min(1, "Numéro requis").max(10, "10 caractères maximum"),
    floor: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ message: "Étage requis" }).int("Nombre entier requis").min(0, "Étage invalide").max(50, "Étage invalide"),
    ),
    type: z.enum(["STANDARD", "VIP", "ICU"], { message: "Type requis" }),
    serviceId: z.preprocess(emptyToUndefined, z.string().cuid("Service invalide").optional()),
    beds: z.preprocess(
      emptyToUndefined,
      z.coerce.number({ message: "Nombre invalide" }).int("Nombre entier requis").min(0, "0 minimum").max(20, "20 maximum").default(1),
    ),
  })
  .superRefine((v, ctx) => {
    // Règle métier : les chambres STANDARD appartiennent à un service ; VIP et ICU n'en ont pas.
    if (v.type === "STANDARD" && !v.serviceId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["serviceId"], message: "Service requis pour une chambre standard" });
    }
  });

export type ChambreInput = z.infer<typeof chambreSchema>;
