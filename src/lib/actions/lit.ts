"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { litSchema } from "@/lib/validations/lit";
import { todayInHospitalTz } from "@/lib/dates";

export type LitFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createLit(_prev: LitFormState, formData: FormData): Promise<LitFormState> {
  await requireRole(["ADMIN"]);

  const parsed = litSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les champs.", errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  // Un nouveau lit n'a pas de patient : il ne peut pas être « Occupé ».
  if (data.status === "OCCUPIED") {
    return { success: false, errors: { status: ["Un nouveau lit ne peut pas être occupé."] } };
  }

  try {
    await prisma.lit.create({ data: { bedNumber: data.bedNumber, chambreId: data.chambreId, status: data.status } });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : undefined;
    if (code === "P2002") return { success: false, errors: { bedNumber: ["Ce numéro existe déjà dans cette chambre."] } };
    if (code === "P2003") return { success: false, errors: { chambreId: ["Chambre introuvable."] } };
    console.error(e);
    return { success: false, message: "Erreur serveur. Le lit n'a pas été créé." };
  }

  revalidatePath("/lits");
  revalidatePath("/chambres");
  revalidatePath("/");
  redirect("/lits?created=1");
}

export async function updateLit(id: string, _prev: LitFormState, formData: FormData): Promise<LitFormState> {
  await requireRole(["ADMIN", "NURSE", "RECEPTIONIST"]);

  const parsed = litSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les champs.", errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  try {
    const existing = await prisma.lit.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!existing) {
      return { success: false, message: "Lit introuvable." };
    }

    // Tsy azo atao OCCUPIED raha tsy misy patient, ary tsy azo ovaina raha misy patient (raha tsy AVAILABLE/MAINTENANCE miaraka amin'ny fanalana patient)
    if (data.status === "OCCUPIED" && !existing.patient) {
      return {
        success: false,
        errors: { status: ["Impossible de marquer occupé sans patient assigné."] },
        message: "Assignez d'abord un patient.",
      };
    }

    if (existing.patient && data.status !== "OCCUPIED") {
      // Miala ny patient amin'ny lit (discharge logique côté lit)
      // La libération du lit vaut sortie : on date la sortie (sans jamais précéder l'entrée).
      const today = todayInHospitalTz();
      const admitted = existing.patient.admittedAt;
      const dischargedAt = admitted && admitted > today ? admitted : today;
      await prisma.$transaction(async (tx) => {
        await tx.patient.update({
          where: { id: existing.patient!.id },
          data: { litId: null, status: "DISCHARGED", dischargedAt },
        });
        await tx.lit.update({
          where: { id },
          data: {
            bedNumber: data.bedNumber,
            chambreId: data.chambreId,
            status: data.status,
          },
        });
      });
    } else {
      await prisma.lit.update({
        where: { id },
        data: {
          bedNumber: data.bedNumber,
          chambreId: data.chambreId,
          status: data.status,
        },
      });
    }
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code: string }).code === "P2002") {
      return { success: false, errors: { bedNumber: ["Ce numéro existe déjà dans cette chambre."] } };
    }
    console.error(e);
    return { success: false, message: "Erreur serveur." };
  }

  revalidatePath("/lits");
  revalidatePath("/chambres");
  revalidatePath("/");
  redirect("/lits?updated=1");
}

export async function deleteLit(id: string) {
  await requireRole(["ADMIN"]);

  const lit = await prisma.lit.findUnique({
    where: { id },
    include: { patient: true },
  });
  if (!lit) return;

  if (lit.patient) {
    throw new Error("Impossible de supprimer un lit occupé. Libérez d'abord le patient.");
  }

  await prisma.lit.delete({ where: { id } });
  revalidatePath("/lits");
  revalidatePath("/chambres");
  revalidatePath("/");
}
