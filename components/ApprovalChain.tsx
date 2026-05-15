"use client";

import clsx from "clsx";
import type { Approval } from "@/lib/types";
import { Check, Clock, MessageSquare, Mail, ShieldCheck, Undo2, XCircle } from "lucide-react";
import { formatDateTime, initials } from "@/lib/format";
import { ApprovalActionsMenu } from "./ApprovalActionsMenu";

interface Props {
  approvals: Approval[];
  onSimulateApprove?: (approval: Approval) => void;
  onReassign?: (approval: Approval) => void;
  onReping?: (approval: Approval) => void;
  onReject?: (approval: Approval) => void;
  /**
   * Withdraw an approval. The parent decides whether the current operator is
   * allowed to undo this specific row (the store only lets the original
   * approver withdraw); the row renders the Undo control only if this prop is
   * supplied AND `canUndoApprove(approval)` returns true.
   */
  onUndoApprove?: (approval: Approval) => void;
  canUndoApprove?: (approval: Approval) => boolean;
  /**
   * Logged-in operator's display name (e.g. "Martina Holst" in this demo).
   * Used to distinguish the operator's own approval row (where the action is
   * a real "Approve" since they're already in the app) from approvals
   * assigned to others (where we simulate them clicking Approve in Slack).
   */
  operatorName?: string;
}

/**
 * Renders the resolved approval chain.
 *
 * Each row reads the assigned individual + selection reason from the Approval
 * itself (populated by computeRouting via the approver-directory). The component
 * never resolves role-to-person on its own. If an Approval lacks an assigned
 * name (legacy seeded data), the row falls back to the role label with a small
 * "Role only" note so the gap is visible rather than hidden.
 */
export function ApprovalChain({
  approvals,
  onSimulateApprove,
  onReassign,
  onReping,
  onReject,
  onUndoApprove,
  canUndoApprove,
  operatorName,
}: Props) {
  if (approvals.length === 0) {
    return null;
  }
  return (
    <div className="space-y-3">
      {approvals.map((a) => {
        const decided = a.status === "approved" || a.status === "auto_approved";
        const personName = a.assignedName ?? a.role;
        const avatarColor = a.assignedAvatarColor ?? "bg-ink-100 text-ink-700";
        const title = a.assignedTitle ?? a.role;
        // Tour anchors live on the operator's row only (the only row where
        // Undo is real and where the actions menu is most relevant to demo).
        const isOperatorRow = operatorName !== undefined && personName === operatorName;
        return (
          <div
            key={`${a.role}-${a.assignedUserId ?? "unassigned"}`}
            className={clsx(
              "rounded-xl border p-4",
              isOperatorRow && "tour-anchor-approval-operator-row",
              decided ? "border-sage-500/30 bg-sage-50/50" : a.status === "rejected" ? "border-rose-500/30 bg-rose-50/50" : "border-ink-200 bg-white",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={clsx("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", avatarColor)}>
                  {initials(personName)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <div className="font-medium text-ink-900">{personName}</div>
                    <span className="text-[11px] text-ink-500">{title}</span>
                    <span className="rounded bg-ink-50 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ink-500 ring-1 ring-inset ring-ink-100">
                      {a.role}
                    </span>
                  </div>

                  <div className="mt-0.5 text-[12px] text-ink-500">{a.reason}</div>

                  {a.selectionReason && (
                    <div className="mt-1 flex items-start gap-1 text-[11px] text-ink-500">
                      <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-ink-400" />
                      <span>
                        <span className="font-medium text-ink-600">Picked because:</span> {a.selectionReason}
                      </span>
                    </div>
                  )}

                  {a.delegateOfName && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-800 ring-1 ring-inset ring-amber-200">
                      Delegating for {a.delegateOfName}
                    </div>
                  )}

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      {a.channel === "Email magic link" ? <Mail className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                      {a.channel}
                    </span>
                    {a.assignedEmail && (
                      <span className="font-mono text-[10px] text-ink-400">{a.assignedEmail}</span>
                    )}
                    {!a.assignedName && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 ring-1 ring-inset ring-amber-200">
                        Role only (no member assigned)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-start gap-2">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <ApprovalStatusPill status={a.status} />
                    {a.status === "approved" && onUndoApprove && canUndoApprove?.(a) && (
                      <button
                        type="button"
                        onClick={() => onUndoApprove(a)}
                        className={clsx(
                          // Mobile: padded out to ~32px tall so the pill is
                          // actually tappable; desktop keeps the dense pill.
                          "tour-anchor-approval-undo inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-medium text-ink-700 ring-1 ring-inset ring-ink-200 hover:bg-ink-100 hover:text-ink-900 sm:px-2 sm:py-0.5 sm:text-[11px]",
                        )}
                        title="Withdraw your approval. Returns the row to pending and walks the contract back to awaiting_approval if this was the last approver."
                      >
                        <Undo2 className="h-3 w-3" /> Undo
                      </button>
                    )}
                  </div>
                  {a.decidedAt && (
                    <div className="text-[11px] text-ink-500">{formatDateTime(a.decidedAt)}</div>
                  )}
                </div>
                {a.status === "pending" && (onReassign || onReping || onReject) && (
                  <div className={clsx(isOperatorRow && "tour-anchor-approval-actions-menu")}>
                    <ApprovalActionsMenu
                      approval={a}
                      onReassign={() => onReassign?.(a)}
                      onReping={() => onReping?.(a)}
                      onReject={() => onReject?.(a)}
                    />
                  </div>
                )}
              </div>
            </div>

            {a.status === "pending" && onSimulateApprove && (() => {
              const isOperator = operatorName !== undefined && personName === operatorName;
              return (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3">
                  <div className="text-[11px] text-ink-500">
                    {isOperator ? (
                      <>You are signed in as {personName}. Approving here is real.</>
                    ) : (
                      <>
                        <span className="demo-note mr-1.5">Demo</span>
                        Real product Slacks {personName} with one-click Approve / Reject buttons.
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => onSimulateApprove(a)}
                    className={clsx(
                      "rounded-md bg-ink-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-ink-800",
                      isOperator && "tour-anchor-approval-operator-approve",
                      !isOperator && "tour-anchor-approval-simulate-button",
                    )}
                  >
                    {isOperator ? "Approve" : `Simulate ${personName.split(" ")[0]} approves`}
                  </button>
                </div>
              );
            })()}

            {a.status === "rejected" && a.decidedBy && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-rose-50 px-2.5 py-1.5 text-[11px] text-rose-700 ring-1 ring-inset ring-rose-200">
                <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                <div>
                  <span className="font-medium">Rejected by {a.decidedBy}.</span>{" "}
                  Contract returned to owner for revisions; see audit trail for full reason.
                </div>
              </div>
            )}
            {a.status === "approved" && a.decidedBy && (
              <div className="mt-2 text-[11px] text-ink-500">
                Approved by {a.decidedBy}
                {onUndoApprove && canUndoApprove?.(a) && (
                  <span className="ml-1 text-ink-400">(your approval; use Undo above to withdraw)</span>
                )}
              </div>
            )}
            {a.status === "auto_approved" && (
              <div className="mt-2 text-[11px] text-ink-500">
                Auto-approved by standing rule
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ApprovalStatusPill({ status }: { status: Approval["status"] }) {
  if (status === "approved" || status === "auto_approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage-50 px-2 py-0.5 text-[11px] font-medium text-sage-500 ring-1 ring-inset ring-sage-500/20">
        <Check className="h-3 w-3" /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-500 ring-1 ring-inset ring-rose-500/20">Rejected</span>;
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-medium text-accent-700 ring-1 ring-inset ring-accent-200">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}
