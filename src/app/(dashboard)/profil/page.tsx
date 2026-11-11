import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrateur",
  DOCTOR: "Médecin",
  NURSE: "Infirmier(e)",
  RECEPTIONIST: "Réceptionniste",
};

export default async function ProfilPage() {
  const session = await auth();
  const user = await prisma.user.findUnique({ where: { id: session!.user.id } });
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Mon profil</h1>
      <p className="mb-6 text-sm text-slate-500">Modifiez vos informations personnelles et votre mot de passe.</p>
      <ProfileForm
        defaultValues={{ name: user.name, email: user.email }}
        roleLabel={ROLE_LABEL[user.role] ?? user.role}
        department={user.department}
      />
    </div>
  );
}
