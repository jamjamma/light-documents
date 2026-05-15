"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Compact actions rendered in the modal header, immediately before the close button. */
  headerActions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
}

const sizeClass: Record<NonNullable<Props["size"]>, string> = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, title, subtitle, headerActions, onClose, children, footer, size = "lg" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/40" onClick={onClose} aria-hidden />
      <div className={`relative z-10 w-full ${sizeClass[size]} overflow-hidden rounded-2xl bg-white shadow-2xl`}>
        {(title || subtitle) && (
          <header className="flex items-start justify-between gap-3 border-b border-ink-100 px-4 py-3.5 sm:gap-4 sm:px-6 sm:py-4">
            <div className="min-w-0">
              {title && <h3 className="text-base font-semibold text-ink-900">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerActions}
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>
        )}
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
        {footer && (
          // flex-wrap + smaller side padding on mobile so multi-button footers
          // (the DocuSign preview has 4: Show API / Save draft / Close / Send)
          // don't push the primary action off-screen on a 375px phone.
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/60 px-4 py-3 sm:gap-3 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
