import Link from "next/link";
import { IconEye } from "@/components/icons";

export function ViewLink({ href, title = "Voir" }: { href: string; title?: string }) {
  return (
    <Link
      href={href}
      title={title}
      aria-label={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100"
    >
      <IconEye size={16} />
    </Link>
  );
}
