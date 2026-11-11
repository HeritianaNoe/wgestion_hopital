"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { staffSchema } from "@/lib/validations/staff";

export type StaffFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createStaff(_prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  await requireRole(["ADMIN"]);

  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les champs.", errors: parsed.error.flatten().fieldErrors };
  }

  const { password, ...data } = parsed.data;
  if (!password) {
    return { success: false, errors: { password: ["Mot de passe requis pour un nouvel utilisateur."] } };
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { ...data, password: hash } });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return { success: false, errors: { email: ["Cet email est déjà utilisé."] } };
    }
    console.error(e);
    return { success: false, message: "Erreur serveur." };
  }

  revalidatePath("/staff");
  redirect("/staff?created=1");
}

export async function updateStaff(id: string, _prev: StaffFormState, formData: FormData): Promise<StaffFormState> {
  await requireRole(["ADMIN"]);

  const parsed = staffSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les champs.", errors: parsed.error.flatten().fieldErrors };
  }

  const { password, ...data } = parsed.data;

  try {
    const updateData: Record<string, unknown> = { ...data };
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    await prisma.user.update({ where: { id }, data: updateData });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return { success: false, errors: { email: ["Cet email est déjà utilisé."] } };
    }
    console.error(e);
    return { success: false, message: "Erreur serveur." };
  }

  revalidatePath("/staff");
  redirect("/staff?updated=1");
}

export async function deleteStaff(id: string) {
  await requireRole(["ADMIN"]);
  const session = await requireRole(["ADMIN"]);
  if (session.user.id === id) {
    throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath("/staff");
}
