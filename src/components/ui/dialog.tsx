"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, pending, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]"
        aria-hidden
        onClick={() => !pending && onCancel()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="relative z-10 w-full max-w-sm rounded-xl border border-emerald-100 bg-white p-5 shadow-xl"
      >
        <h2 id={titleId} className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-2 text-sm text-slate-600">
            {description}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending}
            onClick={onConfirm}
            className={
              danger
                ? "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
                : undefined
            }
          >
            {pending ? "…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
