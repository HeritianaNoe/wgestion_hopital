import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Nom requis (2 caractères minimum)").max(60, "60 caractères maximum"),
  description: z.preprocess(emptyToUndefined, z.string().trim().max(300, "300 caractères maximum").optional()),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
