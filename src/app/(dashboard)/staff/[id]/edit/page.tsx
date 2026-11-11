import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateStaff } from "@/lib/actions/staff";
import { StaffForm } from "../../staff-form";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, role: true, department: true }, // jamais le hash du mot de passe
  });
  if (!user) notFound();

  const boundUpdate = updateStaff.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Modifier {user.name}</h1>
      <p className="mb-6 text-sm text-slate-500">{user.email}</p>
      <StaffForm
        action={boundUpdate}
        isEdit
        defaultValues={{
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        }}
      />
    </div>
  );
}
