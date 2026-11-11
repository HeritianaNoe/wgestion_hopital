"use client";

import { useState, useTransition } from "react";
import { IconTrash } from "@/components/icons";
import { ConfirmDialog } from "@/components/ui/dialog";

export function DeleteButton({
  action,
  confirmMessage = "Cette action est irréversible.",
  title = "Supprimer",
  dialogTitle = "Confirmer la suppression",
}: {
  action: () => Promise<void>;
  confirmMessage?: string;
  title?: string;
  dialogTitle?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        title={title}
        aria-label={title}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50 disabled:opacity-50"
        onClick={() => setOpen(true)}
      >
        {pending ? <span className="text-xs">…</span> : <IconTrash size={16} />}
      </button>

      <ConfirmDialog
        open={open}
        title={dialogTitle}
        description={confirmMessage}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        pending={pending}
        onCancel={() => !pending && setOpen(false)}
        onConfirm={() => {
          start(async () => {
            await action();
            setOpen(false);
          });
        }}
      />
    </>
  );
}
