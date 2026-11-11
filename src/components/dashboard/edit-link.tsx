import Link from "next/link";
import { IconPencil } from "@/components/icons";

export function EditLink({ href, title = "Modifier" }: { href: string; title?: string }) {
  return (
    <Link
      href={href}
      title={title}
      aria-label={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-emerald-700 transition hover:bg-emerald-50"
    >
      <IconPencil size={16} />
    </Link>
  );
}
