"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";
import { chambreSchema } from "@/lib/validations/chambre";

export type ChambreFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createChambre(_prev: ChambreFormState, formData: FormData): Promise<ChambreFormState> {
  await requireRole(["ADMIN"]);

  const parsed = chambreSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Veuillez corriger les champs.", errors: parsed.error.flatten().fieldErrors };
  }
  const { number, floor, type, serviceId, beds } = parsed.data;

  try {
    await prisma.chambre.create({
      data: {
        number,
        floor,
        type,
        serviceId: type === "STANDARD" ? serviceId! : null, // VIP / ICU : jamais de service (CHECK SQL aussi)
        // Lits numérotés comme dans le seed : « 101-1 », « 101-2 »...
        lits: { create: Array.from({ length: beds }, (_, i) => ({ bedNumber: `${number}-${i + 1}` })) },
      },
    });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? (e as { code: string }).code : undefined;
    if (code === "P2002") return { success: false, errors: { number: ["Ce numéro de chambre existe déjà."] } };
    if (code === "P2003") return { success: false, errors: { serviceId: ["Service introuvable."] } };
    console.error(e);
    return { success: false, message: "Erreur serveur. La chambre n'a pas été créée." };
  }

  revalidatePath("/chambres");
  revalidatePath("/lits");
  revalidatePath("/");
  redirect("/chambres?created=1");
}
