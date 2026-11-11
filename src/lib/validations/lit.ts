import { z } from "zod";

export const litSchema = z.object({
  bedNumber: z.string().trim().min(1, "Numéro de lit requis"),
  chambreId: z.string().cuid("Chambre invalide"),
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"], { message: "Statut requis" }),
});

export type LitInput = z.infer<typeof litSchema>;
