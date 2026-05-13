"use client";

import { useMemo, useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { initials } from "@/lib/format";
import { listMembers, listActiveDelegations } from "@/lib/approver-directory";
import type { Approval, ApproverMember } from "@/lib/types";
import { CheckCircle2, MessageSquare, Mail, Plane } from "lucide-react";
import clsx from "clsx";

interface Props {
  open: boolean;
  approval: Approval | null;
  onClose: () => void;
  onConfirm: (input: { newUserId: string; reason: string; intent: "reassign" | "pass_on" }) => void;
}

const REASON_PRESETS = [
  "Balancing workload across the team",
  "Specialty mismatch (need a different reviewer)",
  "Original assignee on PTO / unavailable",
  "Escalating to a more senior approver",
];

/**
 * Modal for reassigning or passing-on a pending approval to a different member
 * of the same group. Shows every group member with their specialty tags, an
 * out-of-office marker if applicable, and a quick presets row above the
 * free-text reason field so an operator can finish the flow in two clicks.
 */
export function ReassignModal({ open, approval, onClose, onConfirm }: Props) {
  const members = useMemo<ApproverMember[]>(() => {
    if (!approval) return [];
    return [...listMembers(approval.role)];
  }, [approval]);

  const oooByUserId = useMemo(() => {
    const delegations = listActiveDelegations();
    const map = new Map<string, string>();
    for (const d of delegations) {
      map.set(d.fromUserId, d.reason ?? "Delegated");
    }
    return map;
  }, [open]);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [intent, setIntent] = useState<"reassign" | "pass_on">("reassign");

  if (!approval) return null;

  const currentName = approval.assignedName ?? approval.role;
  const canSubmit = selectedUserId.length > 0 && reason.trim().length > 0 && selectedUserId !== approval.assignedUserId;

  const reset = () => {
    setSelectedUserId("");
    setReason("");
    setIntent("reassign");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleConfirm = () => {
    if (!canSubmit) return;
    onConfirm({ newUserId: selectedUserId, reason: reason.trim(), intent });
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="lg"
      title={
        <span>
          Reassign <span className="text-ink-500">{approval.role}</span> approval
        </span>
      }
      subtitle={
        <span>
          Currently assigned to <strong>{currentName}</strong>. Pick a different member of the {approval.role} group and add a reason. The audit trail records the override.
        </span>
      }
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!canSubmit}>
            {intent === "pass_on" ? "Pass on" : "Reassign"} to {selectedUserId ? (members.find((m) => m.userId === selectedUserId)?.name?.split(" ")[0] ?? "selected") : "…"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-ink-200 bg-ink-50/40 p-2.5 text-[11px] text-ink-600">
          <span className="demo-note mr-2">Intent</span>
          <label className="mr-3 inline-flex items-center gap-1.5">
            <input
              type="radio"
              name="intent"
              checked={intent === "reassign"}
              onChange={() => setIntent("reassign")}
              className="h-3.5 w-3.5"
            />
            <span><strong>Reassign</strong> — operator override (Head of F&amp;O / contract owner)</span>
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input
              type="radio"
              name="intent"
              checked={intent === "pass_on"}
              onChange={() => setIntent("pass_on")}
              className="h-3.5 w-3.5"
            />
            <span><strong>Pass on</strong> — current assignee delegates</span>
          </label>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-500">
            Pick a new approver
          </div>
          <ul className="space-y-2">
            {members.map((m) => {
              const isCurrent = m.userId === approval.assignedUserId;
              const isSelected = m.userId === selectedUserId;
              const ooo = oooByUserId.get(m.userId);
              return (
                <li key={m.userId}>
                  <button
                    type="button"
                    onClick={() => !isCurrent && setSelectedUserId(m.userId)}
                    disabled={isCurrent}
                    className={clsx(
                      "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                      isCurrent && "cursor-not-allowed border-ink-100 bg-ink-50/50 opacity-60",
                      !isCurrent && isSelected && "border-ink-900 bg-ink-50",
                      !isCurrent && !isSelected && "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/40",
                    )}
                  >
                    <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", m.avatarColor)}>
                      {initials(m.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[13px] font-semibold text-ink-900">{m.name}</span>
                        <span className="text-[11px] text-ink-500">{m.title}</span>
                        {isCurrent && (
                          <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-600">Current</span>
                        )}
                        {ooo && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 ring-1 ring-inset ring-amber-200">
                            <Plane className="h-3 w-3" /> {ooo}
                          </span>
                        )}
                      </div>
                      {m.specialties.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {m.specialties.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-ink-50 px-1.5 py-0.5 text-[10px] font-mono text-ink-600 ring-1 ring-inset ring-ink-100"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-1 font-mono text-[10px] text-ink-400">{m.email}</div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-900" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="reassign-reason" className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
              Reason
            </label>
            <span className="text-[10px] text-ink-400">required, visible in audit trail</span>
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
            id="reassign-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why are you overriding the assigned approver?"
            rows={3}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-ink-400 focus:outline-none"
          />
        </div>

        <div className="rounded-lg border border-ink-100 bg-ink-50/40 px-3 py-2.5 text-[11px] text-ink-600">
          <span className="demo-note mr-1.5">Notification fan-out</span>
          {intent === "reassign" ? (
            <>
              <strong>Reassign</strong> sends Slack DMs to: <strong>the new approver</strong> (action required), <strong>{currentName}</strong> (removed from queue), and <strong>the contract owner</strong> (chain changed FYI).
            </>
          ) : (
            <>
              <strong>Pass on</strong> sends Slack DMs to: <strong>the new approver</strong> (action required, with note "covering for {currentName}"), <strong>the contract owner</strong> (chain changed FYI), and <strong>Head of Finance &amp; Ops</strong> (queue-management signal). Pass-on patterns get aggregated to surface workload + specialty imbalances over time.
            </>
          )}
        </div>

        <div className="rounded-lg border border-dashed border-ink-200 bg-white px-3 py-2.5 text-[11px] text-ink-500">
          <span className="demo-note mr-1.5">Out of scope here</span>
          To <strong>add or remove members</strong> from the {approval.role} group, or to mark yourself out-of-office, use <strong>Settings → Approvers</strong> (Head of Finance &amp; Ops only). Reassign is for routing within an existing group; membership lives in the directory.
        </div>
      </div>
    </Modal>
  );
}
