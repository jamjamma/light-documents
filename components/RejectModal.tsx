"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import type { Approval } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  approval: Approval | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const REASON_PRESETS = [
  "Liability cap below master template threshold",
  "Indemnity terms shift risk asymmetrically",
  "Salary above band; needs CFO review of comp ladder",
  "Counterparty entity not in good standing",
  "MSA reference missing or invalid",
];

/**
 * Modal for rejecting a pending approval. On confirm the row goes to
 * status=rejected, contract transitions to needs_info, and a simulated DM is
 * sent to the contract owner with the reason.
 */
export function RejectModal({ open, approval, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState("");

  if (!approval) return null;

  const reset = () => setReason("");
  const handleClose = () => { reset(); onClose(); };
  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="md"
      title={
        <span>
          Reject <span className="text-ink-500">{approval.role}</span> approval
        </span>
      }
      subtitle={
        <span>
          Rejection bounces this contract back to the owner ({approval.assignedName ? "and clears it from " + approval.assignedName + "'s queue" : "needs_info stage"}).
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button variant="danger" onClick={handleConfirm} disabled={!reason.trim()}>
            Reject and return to owner
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div>
            The contract owner will be notified with the rejection reason and routed back to draft.
            They will need to address the issue and re-run clause checks before this approval can be requested again.
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="reject-reason" className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
              Reason
            </label>
            <span className="text-[10px] text-ink-400">required, visible in audit trail and Slack DM</span>
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {REASON_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className="rounded-full border border-ink-200 bg-white px-2.5 py-0.5 text-[11px] text-ink-700 hover:border-ink-300 hover:bg-ink-50"
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What needs to change before this can be approved?"
            rows={4}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-rose-400 focus:outline-none"
          />
        </div>
      </div>
    </Modal>
  );
}
