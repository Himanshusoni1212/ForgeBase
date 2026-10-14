import { useEffect, useRef } from "react";
import Button from "./Button";

// Accessible confirmation dialog for destructive actions
// (revoke key, delete document, …). Rendered only when `open`.
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirming = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  // Focus the safe choice on open; close on Escape.
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    function onKey(event) {
      if (event.key === "Escape") onCancel?.();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={confirming ? undefined : onCancel}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-navy-700 bg-navy-800 p-6 shadow-xl shadow-black/40">
        <h3
          id="confirm-dialog-title"
          className="text-base font-semibold text-white"
        >
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 text-sm text-slate-400">{description}</p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <span ref={cancelRef} tabIndex={-1} className="outline-none">
            <Button
              type="button"
              variant="secondary"
              disabled={confirming}
              onClick={onCancel}
              className="w-auto px-4"
            >
              {cancelLabel}
            </Button>
          </span>
          <Button
            type="button"
            variant="danger"
            loading={confirming}
            disabled={confirming}
            onClick={onConfirm}
            className="w-auto px-4"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
