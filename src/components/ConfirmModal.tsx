import React from 'react';
import { X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!open) return null;

  const confirmClass =
    variant === 'danger'
      ? 'border-danger/40 bg-danger/10 hover:bg-danger/20 text-danger'
      : 'border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={loading ? undefined : onCancel}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md border border-darkBorder bg-[#0c0c0e] rounded-[4px] shadow-xl font-mono"
      >
        <div className="flex items-center justify-between border-b border-darkBorder px-4 py-3">
          <h2 id="confirm-modal-title" className="text-sm font-bold text-textPrimary uppercase tracking-wide">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="text-textMuted hover:text-textPrimary transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-4 space-y-4">
          <p className="text-xs text-textMuted leading-relaxed">{message}</p>
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-darkBorder px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1.5 text-xs border border-darkBorder rounded-[4px] text-textMuted hover:text-textPrimary hover:border-textMuted transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-3 py-1.5 text-xs font-bold border uppercase rounded-[4px] tracking-wider transition-colors disabled:opacity-40 ${confirmClass}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
