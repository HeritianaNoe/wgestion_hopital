import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/dates";
import { ROLE_LABEL, ROLE_STYLE } from "@/lib/roles";
import { IconDownload, IconPencil, IconUser } from "@/components/icons";

export const dynamic = "force-dynamic";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // select : le hash du mot de passe n'est jamais chargé
  const u = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, department: true, createdAt: true, updatedAt: true },
  });
  if (!u) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/staff" className="text-sm text-emerald-700 hover:underline">
          ← Retour au personnel
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <IconUser size={22} />
            </span>
            <h1 className="text-2xl font-semibold text-slate-900">{u.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLE[u.role]}`}>{ROLE_LABEL[u.role]}</span>
            <Link
              href={`/staff/${u.id}/edit`}
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
            >
              <IconPencil size={14} />
              Modifier
            </Link>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-emerald-100 bg-white">
        <h2 className="border-b border-emerald-100 px-5 py-3 font-medium text-slate-900">Informations</h2>
        <dl className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nom">{u.name}</Field>
          <Field label="Email">{u.email}</Field>
          <Field label="Rôle">{ROLE_LABEL[u.role]}</Field>
          <Field label="Département">{u.department ?? "—"}</Field>
        </dl>
      </section>

      <section className="rounded-xl border border-emerald-100 bg-white">
        <h2 className="border-b border-emerald-100 px-5 py-3 font-medium text-slate-900">Compte</h2>
        <dl className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Créé le">{formatDateTime(u.createdAt)}</Field>
          <Field label="Dernière modification">{formatDateTime(u.updatedAt)}</Field>
        </dl>
      </section>

      <div className="flex justify-end">
        {/* <a> et non <Link> : téléchargement direct, sans préchargement */}
        <a
          href={`/staff/${u.id}/pdf`}
          download
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <IconDownload size={16} />
          Télécharger en PDF
        </a>
      </div>
    </div>
  );
}
