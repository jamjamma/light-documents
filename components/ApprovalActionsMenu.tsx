"use client";

import { useEffect, useRef, useState } from "react";
import type { Approval } from "@/lib/types";
import { MoreHorizontal, UserPlus, BellRing, XCircle } from "lucide-react";
import clsx from "clsx";

interface Props {
  approval: Approval;
  onReassign: () => void;
  onReping: () => void;
  onReject: () => void;
}

/**
 * Per-row action menu rendered on pending approvals. Lazy mount: only one menu
 * can be open at a time (handled via document-level click-away listener).
 */
export function ApprovalActionsMenu({ approval, onReassign, onReping, onReject }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handle = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Actions for ${approval.assignedName ?? approval.role}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={clsx(
          "inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-500 transition-colors",
          open ? "bg-ink-100 text-ink-900" : "hover:bg-ink-100 hover:text-ink-900",
        )}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-52 overflow-hidden rounded-lg border border-ink-200 bg-white py-1 shadow-lg"
        >
          <MenuItem icon={<UserPlus className="h-3.5 w-3.5" />} onClick={handle(onReassign)}>
            Reassign / Pass on…
          </MenuItem>
          <MenuItem icon={<BellRing className="h-3.5 w-3.5" />} onClick={handle(onReping)}>
            Re-ping (resend Slack DM)
          </MenuItem>
          <div className="my-1 h-px bg-ink-100" />
          <MenuItem icon={<XCircle className="h-3.5 w-3.5" />} onClick={handle(onReject)} danger>
            Reject…
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={clsx(
        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors",
        danger ? "text-rose-600 hover:bg-rose-50" : "text-ink-800 hover:bg-ink-50",
      )}
    >
      <span className={clsx("text-[14px]", danger ? "text-rose-500" : "text-ink-500")}>{icon}</span>
      <span>{children}</span>
    </button>
  );
}
