import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { buildPatientPdf } from "@/lib/patient-pdf";

export const dynamic = "force-dynamic";

const STATUS_LABEL = { ADMITTED: "Hospitalisé", DISCHARGED: "Sorti", OUTPATIENT: "Externe" } as const;
const GENDER_LABEL = { MALE: "Homme", FEMALE: "Femme", OTHER: "Autre" } as const;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const p = await prisma.patient.findUnique({
    where: { id },
    include: { lit: { select: { bedNumber: true, chambre: { select: { number: true, floor: true } } } } },
  });
  if (!p) return new Response("Not found", { status: 404 });

  const bytes = await buildPatientPdf({
    fullName: `${p.lastName.toUpperCase()} ${p.firstName}`,
    rows: [
      ["Date de naissance", formatDate(p.dob)],
      ["Sexe", GENDER_LABEL[p.gender]],
      ["Téléphone", p.phone ?? "—"],
      ["Contact d'urgence", p.emergencyContact ?? "—"],
      ["Statut", STATUS_LABEL[p.status]],
      ["Chambre / lit", p.lit ? `Chambre ${p.lit.chambre.number} (étage ${p.lit.chambre.floor}) / lit ${p.lit.bedNumber}` : "—"],
      ["Date d'entrée", formatDate(p.admittedAt)],
      ["Date de sortie", formatDate(p.dischargedAt)],
    ],
    medicalHistory: p.medicalHistory?.trim() ?? "",
    generatedAt: new Date().toLocaleString("fr-FR", { timeZone: process.env.APP_TIMEZONE ?? "Indian/Antananarivo" }),
  });

  const filename = `patient-${p.lastName}-${p.firstName}`.replace(/[^a-zA-Z0-9_-]+/g, "_") + ".pdf";
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
