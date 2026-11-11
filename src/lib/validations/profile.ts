import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v === "" ? undefined : v);

export const profileSchema = z
  .object({
    name: z.string().trim().min(2, "Nom requis"),
    email: z.string().trim().toLowerCase().email("Email invalide"), // le login compare en minuscules
    currentPassword: z.preprocess(emptyToUndefined, z.string().optional()),
    newPassword: z.preprocess(emptyToUndefined, z.string().min(8, "8 caractères minimum").optional()),
    confirmPassword: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  .superRefine((v, ctx) => {
    if (!v.newPassword) return;
    if (!v.currentPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["currentPassword"], message: "Mot de passe actuel requis" });
    }
    if (v.newPassword !== v.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Les mots de passe ne correspondent pas" });
    }
  });
