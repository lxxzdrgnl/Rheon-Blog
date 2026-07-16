"use client";

interface ConfirmModalProps {
  title: string;
  open: boolean;
  saving?: boolean;
  confirmLabel?: string;
  savingLabel?: string;
  size?: "default" | "full";
  onClose: () => void;
  onConfirm: () => void;
  children: React.ReactNode;
}

export function ConfirmModal({
  title,
  open,
  saving = false,
  confirmLabel = "확인",
  savingLabel = "저장 중...",
  size = "default",
  onClose,
  onConfirm,
  children,
}: ConfirmModalProps) {
  if (!open) return null;

  const containerClass = size === "full"
    ? "bg-bg-primary w-full h-full flex flex-col"
    : "bg-bg-primary rounded-2xl border border-border shadow-2xl w-full max-w-lg mx-4 overflow-hidden";

  const bodyClass = size === "full"
    ? "flex-1 min-h-0 overflow-y-auto p-8"
    : "p-6 space-y-6 max-h-[60vh] overflow-y-auto";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm modal-backdrop"
      onClick={() => !saving && onClose()}
    >
      <div
        className={`${containerClass} modal-panel`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border/50 shrink-0 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          {size === "full" && (
            <button onClick={onClose} disabled={saving} className="p-1 text-text-tertiary hover:text-text-primary transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className={bodyClass}>
          {children}
        </div>

        <div className="px-6 py-4 border-t border-border/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-6 py-2 bg-accent text-bg-primary text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? savingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
