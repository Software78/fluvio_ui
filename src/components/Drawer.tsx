import React from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ open, title, onClose, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative w-full max-w-md h-full border-l border-darkBorder bg-[#0c0c0e] flex flex-col font-mono shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-darkBorder px-4 py-3 shrink-0">
          <h2 id="drawer-title" className="text-sm font-bold text-textPrimary uppercase tracking-wide">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-textMuted hover:text-textPrimary transition-colors"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
};
