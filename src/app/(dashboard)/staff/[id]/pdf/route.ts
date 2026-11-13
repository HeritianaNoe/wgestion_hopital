import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/dates";
import { ROLE_LABEL } from "@/lib/roles";
import { buildPatientPdf } from "@/lib/patient-pdf";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  if (session.user.role !== "ADMIN" && session.user.role !== "DIRECTOR") return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  const u = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, role: true, department: true, createdAt: true, updatedAt: true },
  });
  if (!u) return new Response("Not found", { status: 404 });

  const bytes = await buildPatientPdf({
    docTitle: "Fiche personnel",
    fullName: u.name,
    rows: [
      ["Email", u.email],
      ["Rôle", ROLE_LABEL[u.role] ?? u.role],
      ["Département", u.department ?? "—"],
      ["Créé le", formatDateTime(u.createdAt)],
      ["Dernière modification", formatDateTime(u.updatedAt)],
    ],
    generatedAt: new Date().toLocaleString("fr-FR", { timeZone: process.env.APP_TIMEZONE ?? "Indian/Antananarivo" }),
  });

  const filename = `personnel-${u.name}`.replace(/[^a-zA-Z0-9_-]+/g, "_") + ".pdf";
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
