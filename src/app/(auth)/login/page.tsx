import { IconHospital } from "@/components/icons";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_28rem]">
      <section className="hidden bg-emerald-800 p-12 text-emerald-50 lg:flex lg:flex-col lg:justify-end">
        <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-700 text-white">
          <IconHospital size={30} />
        </span>
        <h1 className="max-w-md text-4xl font-semibold leading-tight">Gestion Hôpital</h1>
        <p className="mt-3 max-w-md text-emerald-100/80">
          Admissions, lits et dossiers patients au même endroit, pour toute l&apos;équipe soignante.
        </p>
      </section>
      <section className="flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-sm">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white lg:hidden">
            <IconHospital size={24} />
          </span>
          <h2 className="text-2xl font-semibold text-slate-900">Connexion</h2>
          <p className="mb-6 mt-1 text-sm text-slate-500">Utilisez votre compte du personnel.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
