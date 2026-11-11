"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { serviceSchema } from "@/lib/validations/service";

export type ServiceFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createService(_prev: ServiceFormState, formData: FormData): Promise<ServiceFormState> {
  await requireRole(["ADMIN"]);

  const parsed = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les champs.", errors: parsed.error.flatten().fieldErrors };
  }
  const { name, description } = parsed.data;

  // Le nom est unique en base (sensible à la casse) : on bloque aussi « cardiologie » si « Cardiologie » existe.
  const duplicate = await prisma.service.findFirst({ where: { name: { equals: name, mode: "insensitive" } }, select: { id: true } });
  if (duplicate) return { success: false, errors: { name: ["Ce service existe déjà."] } };

  try {
    await prisma.service.create({ data: { name, description: description ?? null } });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return { success: false, errors: { name: ["Ce service existe déjà."] } };
    }
    console.error(e);
    return { success: false, message: "Erreur serveur. Le service n'a pas été créé." };
  }

  revalidatePath("/services");
  revalidatePath("/chambres");
  redirect("/services?created=1");
}
