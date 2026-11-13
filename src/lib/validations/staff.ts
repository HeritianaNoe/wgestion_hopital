import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);

export const staffSchema = z.object({
  name: z.string().trim().min(2, "Nom requis"),
  email: z.string().trim().email("Email invalide"),
  role: z.enum(["ADMIN", "DIRECTOR", "DOCTOR", "NURSE", "RECEPTIONIST"], { message: "Rôle requis" }),
  department: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  password: z.preprocess(
    emptyToUndefined,
    z.string().min(8, "8 caractères minimum").optional()
  ),
});

export type StaffInput = z.infer<typeof staffSchema>;
