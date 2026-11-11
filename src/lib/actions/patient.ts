"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { patientSchema } from "@/lib/validations/patient";
import { todayInHospitalTz } from "@/lib/dates";

export type PatientFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

class BedUnavailableError extends Error {}

export async function createPatient(_prev: PatientFormState, formData: FormData): Promise<PatientFormState> {
  await requireRole(["ADMIN", "RECEPTIONIST", "NURSE"]);

  const parsed = patientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les champs signalés.", errors: parsed.error.flatten().fieldErrors };
  }

  const { litId, admittedAt, dischargedAt, ...data } = parsed.data;
  const status = litId ? "ADMITTED" : data.status;
  const today = todayInHospitalTz();

  // Dates de séjour cohérentes avec le statut (la validation garantit admittedAt pour DISCHARGED).
  let stay: { admittedAt: Date | null; dischargedAt: Date | null } = { admittedAt: null, dischargedAt: null };
  if (status === "ADMITTED") {
    stay = { admittedAt: admittedAt ?? today, dischargedAt: null };
  } else if (status === "DISCHARGED" && admittedAt) {
    const out = dischargedAt ?? today;
    stay = { admittedAt, dischargedAt: out < admittedAt ? admittedAt : out };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (litId) {
        // Atomic claim: only succeeds if the bed is still AVAILABLE (prevents double booking)
        const claimed = await tx.lit.updateMany({
          where: { id: litId, status: "AVAILABLE" },
          data: { status: "OCCUPIED" },
        });
        if (claimed.count === 0) throw new BedUnavailableError();
      }

      await tx.patient.create({
        data: { ...data, ...stay, litId: litId ?? null, status },
      });
    });
  } catch (e) {
    if (e instanceof BedUnavailableError) {
      return { success: false, errors: { litId: ["Ce lit n'est plus disponible."] }, message: "Choisissez un autre lit." };
    }
    console.error(e);
    return { success: false, message: "Erreur serveur. Le patient n'a pas été enregistré." };
  }

  revalidatePath("/");
  revalidatePath("/patients");
  redirect("/?created=1");
}

export async function deletePatient(id: string) {
  await requireRole(["ADMIN", "RECEPTIONIST", "NURSE"]);

  await prisma.$transaction(async (tx) => {
    const patient = await tx.patient.findUnique({ where: { id } });
    if (!patient) return;

    if (patient.litId) {
      await tx.lit.update({
        where: { id: patient.litId },
        data: { status: "AVAILABLE" },
      });
    }
    await tx.patient.delete({ where: { id } });
  });

  revalidatePath("/patients");
  revalidatePath("/");
  revalidatePath("/lits");
  revalidatePath("/chambres");
}
