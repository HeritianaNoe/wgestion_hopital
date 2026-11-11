import Form from "next/form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Formulaire GET géré par next/form : navigation CÔTÉ CLIENT (pas de rechargement complet de la page,
 * le layout et la sidebar restent en place). Les filtres vivent dans l'URL et renvoient à la page 1.
 */
export function FilterBar({
  action,
  active,
  children,
}: {
  /** Chemin de la page, ex. "/patients". */
  action: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Form action={action} className="flex flex-wrap items-end gap-3 rounded-xl border border-emerald-100 bg-white p-4">
      {children}
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">
          Filtrer
        </Button>
        {active && (
          <Link href={action} className="text-sm text-emerald-800 underline-offset-2 hover:underline">
            Réinitialiser
          </Link>
        )}
      </div>
    </Form>
  );
}
