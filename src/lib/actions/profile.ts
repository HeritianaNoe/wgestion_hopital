"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validations/profile";

export type ProfileFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

/** Modifie le profil de l'utilisateur CONNECTÉ uniquement (l'id vient de la session, jamais du formulaire).
 *  Le rôle et le département ne sont pas modifiables ici : ils restent gérés par un ADMIN. */
export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHENTICATED");

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les champs.", errors: parsed.error.flatten().fieldErrors };
  }
  const { name, email, currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { success: false, message: "Compte introuvable." };

  const data: { name: string; email: string; password?: string } = { name, email };
  if (newPassword) {
    const ok = await bcrypt.compare(currentPassword!, user.password);
    if (!ok) return { success: false, errors: { currentPassword: ["Mot de passe actuel incorrect."] } };
    data.password = await bcrypt.hash(newPassword, 12);
  }

  try {
    await prisma.user.update({ where: { id: user.id }, data });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return { success: false, errors: { email: ["Cet email est déjà utilisé."] } };
    }
    console.error(e);
    return { success: false, message: "Erreur serveur." };
  }

  revalidatePath("/", "layout"); // met à jour le nom affiché dans la sidebar
  return { success: true, message: newPassword ? "Profil et mot de passe mis à jour." : "Profil mis à jour." };
}
