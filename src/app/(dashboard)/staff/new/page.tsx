import { createStaff } from "@/lib/actions/staff";
import { StaffForm } from "../staff-form";

export default function NewStaffPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-semibold text-slate-900">Nouveau membre du personnel</h1>
      <p className="mb-6 text-sm text-slate-500">Créer un compte avec accès selon le rôle.</p>
      <StaffForm action={createStaff} />
    </div>
  );
}
