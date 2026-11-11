import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white">
      <h1 className="text-2xl font-semibold text-slate-900">Accès refusé</h1>
      <p className="text-slate-500">Votre rôle ne permet pas d&apos;ouvrir cette page.</p>
      <Link href="/" className="text-emerald-700 underline">Retour au tableau de bord</Link>
    </main>
  );
}
