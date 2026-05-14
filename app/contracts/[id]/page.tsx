"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskBadge } from "@/components/RiskBadge";
import { ClauseDiff } from "@/components/ClauseDiff";
import { RoutingPanel } from "@/components/RoutingPanel";
import { ApprovalChain } from "@/components/ApprovalChain";
import { DocuSignPreviewModal } from "@/components/DocuSignPreviewModal";
import {
  getContract,
  approve,
  send,
  simulateSigned,
  runClauseChecks,
  reassignApproval,
  repingApproval,
  rejectApproval,
  saveDraftAndExit,
  undoApproval,
  findSourceRecord,
} from "@/lib/contract-store";
import { getTemplate } from "@/lib/mock-data";
import { allApproved } from "@/lib/routing-rules";
import { lightSignerRationale } from "@/lib/signer-routing";
import type { Contract, Approval } from "@/lib/types";
import { readTourState, TOUR_STEPS, type TourEffect } from "@/lib/tour-steps";
import { ArrowLeft, FileSignature, Eye, AlertTriangle, Save } from "lucide-react";
import { formatEur, formatDateTime } from "@/lib/format";
import { ReassignModal } from "@/components/ReassignModal";
import { RejectModal } from "@/components/RejectModal";
import { BackButton } from "@/components/BackButton";

// Operator persona who appears in the audit trail as the actor for overrides.
// In production this comes from auth (the logged-in user); for the demo it
// matches the Sidebar's logged-in identity (Head of Finance & Ops).
const OPERATOR_NAME = "Martina Holst";

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [contract, setContract] = useState<Contract | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [reassignFor, setReassignFor] = useState<Approval | null>(null);
  const [rejectFor, setRejectFor] = useState<Approval | null>(null);

  const refresh = () => {
    const c = getContract(id);
    setContract(c ?? null);
  };

  useEffect(() => {
    const c = getContract(id);
    if (c && c.stage === "draft") {
      try {
        runClauseChecks(c.id);
      } catch {
        // ignore invalid transitions, just render what we have
      }
    }
    refresh();
  }, [id]);

  // Tour-driven side-effects: the controller dispatches `tour:effect` events
  // when a step renders. We act on the modal-related ones so the preview modal
  // is open (and its <details> is expanded, and its anchor-tags bar is
  // scrolled into view) by the time driver.js polls for the step's anchor
  // inside the modal. Idempotent — re-firing a modal:open while the modal is
  // already open is a no-op.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ effect?: TourEffect }>).detail;
      switch (detail?.effect) {
        case "modal:open":
          setShowPreview(true);
          break;
        case "modal:close":
          setShowPreview(false);
          break;
        case "modal:expand-config":
          setShowPreview(true);
          // Defer so the modal is mounted, then expand the disclosure so the
          // highlight stage wraps the open panel rather than the 1-line summary.
          window.setTimeout(() => {
            const details = document.querySelector(
              ".tour-anchor-modal-config",
            ) as HTMLDetailsElement | null;
            if (details && !details.open) details.open = true;
          }, 50);
          break;
        case "modal:scroll-anchortags":
          setShowPreview(true);
          // The anchor-tags bar lives below the document preview inside the
          // modal's overflow-y-auto container. driver.js's smoothScroll only
          // scrolls the window; scrollIntoView walks scrollable ancestors so
          // it scrolls the inner modal correctly.
          window.setTimeout(() => {
            const el = document.querySelector(".tour-anchor-modal-anchortags");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 100);
          break;
        case "approval:open-actions":
          // Stepping back to the actions-menu step from the reassign walk:
          // make sure the Reassign modal is closed so the menu underneath is
          // actually visible. Idempotent if no modal is open.
          setReassignFor(null);
          // Programmatically click the "..." button inside the operator's
          // actions-menu wrapper so the menu is visibly open while the tour
          // popover narrates its contents. ApprovalActionsMenu owns its own
          // open state; a real click toggles it the same as a user click.
          // Defer so the click lands AFTER any previous mousedown listeners
          // (the menu has a click-away mousedown listener; a click in the
          // same tick would close it), and AFTER setReassignFor(null) has
          // unmounted the modal.
          window.setTimeout(() => {
            const btn = document.querySelector<HTMLButtonElement>(
              ".tour-anchor-approval-actions-menu button[aria-haspopup='menu']",
            );
            if (btn && btn.getAttribute("aria-expanded") !== "true") {
              btn.click();
            }
          }, 50);
          break;
        case "approval:open-reassign": {
          // Resolve the operator's pending approval directly from the store
          // (the closure-captured `contract` is the initial null; the store
          // returns the latest). Idempotent: if no pending operator row
          // exists (operator already approved before reaching this step),
          // we no-op rather than opening a modal for a stale row.
          const fresh = getContract(id);
          const pending = fresh?.approvals?.find(
            (a) => a.assignedName === OPERATOR_NAME && a.status === "pending",
          );
          if (pending) {
            // Close the actions menu underneath so the modal isn't stacked
            // on top of an open popover menu.
            const menuBtn = document.querySelector<HTMLButtonElement>(
              ".tour-anchor-approval-actions-menu button[aria-haspopup='menu']",
            );
            if (menuBtn && menuBtn.getAttribute("aria-expanded") === "true") {
              menuBtn.click();
            }
            setReassignFor(pending);
          }
          break;
        }
        case "approval:close-reassign":
          setReassignFor(null);
          break;
      }
    };
    window.addEventListener("tour:effect", handler);
    return () => window.removeEventListener("tour:effect", handler);
  }, []);

  // When the operator opens the preview themselves during the
  // `preview-envelope` step, auto-advance the tour into the modal walk. The
  // step itself has `hideNext: true` so this is the only forward path
  // (besides Back). Guarded by `fromStepId` so it's a no-op if the user
  // re-opens the modal at any other time.
  useEffect(() => {
    if (!showPreview) return;
    const state = readTourState();
    if (!state.active) return;
    const step = TOUR_STEPS[state.stepIndex];
    if (step?.id !== "preview-envelope") return;
    window.dispatchEvent(
      new CustomEvent("tour:auto-next", { detail: { fromStepId: "preview-envelope" } }),
    );
  }, [showPreview]);

  // When the user is on the `approval-actions-menu` step and clicks the ...
  // menu open, advance the tour. We observe the aria-expanded attribute on
  // the operator row's menu button. ApprovalActionsMenu owns its own state;
  // we don't need to know about it directly. Re-attaches whenever the
  // contract refreshes (the operator row may unmount briefly between
  // optimistic state changes).
  useEffect(() => {
    const btn = document.querySelector<HTMLButtonElement>(
      ".tour-anchor-approval-actions-menu button[aria-haspopup='menu']",
    );
    if (!btn) return;
    const checkAndAdvance = () => {
      if (btn.getAttribute("aria-expanded") !== "true") return;
      const state = readTourState();
      if (!state.active) return;
      const step = TOUR_STEPS[state.stepIndex];
      if (step?.id !== "approval-actions-menu") return;
      window.dispatchEvent(
        new CustomEvent("tour:auto-next", {
          detail: { fromStepId: "approval-actions-menu" },
        }),
      );
    };
    const mo = new MutationObserver(checkAndAdvance);
    mo.observe(btn, { attributes: true, attributeFilter: ["aria-expanded"] });
    return () => mo.disconnect();
  }, [contract]);

  // Auto-advance the tour when the operator's approval TRANSITIONS to
  // approved during either the approval-approve step (first approval) or
  // the approval-undo step (re-approve after undo). The transition guard
  // (hasMountedRef + prevApprovedRef) prevents a spurious fire on initial
  // page mount when the row is already approved (e.g. user resumed the
  // tour at the undo step).
  const tourApproveHasMountedRef = useRef(false);
  const tourPrevOperatorApprovedRef = useRef(false);
  useEffect(() => {
    if (!contract) return;
    const operatorApproval = contract.approvals?.find(
      (a) => a.assignedName === OPERATOR_NAME,
    );
    const isApproved = operatorApproval?.status === "approved";
    const wasApproved = tourPrevOperatorApprovedRef.current;
    const wasMounted = tourApproveHasMountedRef.current;
    tourPrevOperatorApprovedRef.current = isApproved;
    tourApproveHasMountedRef.current = true;
    if (!wasMounted) return;
    if (!isApproved) return;
    if (wasApproved) return;
    const state = readTourState();
    if (!state.active) return;
    const step = TOUR_STEPS[state.stepIndex];
    if (step?.id !== "approval-approve" && step?.id !== "approval-undo") return;
    window.dispatchEvent(
      new CustomEvent("tour:auto-next", { detail: { fromStepId: step.id } }),
    );
  }, [contract]);

  // Auto-advance the tour when ALL non-operator approvals are approved during
  // the approval-simulate-others step. Both Magnus and Sara must be green for
  // Send to unlock; once both are, the next step (preview-envelope) becomes
  // the natural target.
  useEffect(() => {
    if (!contract) return;
    const others = contract.approvals?.filter(
      (a) => a.assignedName !== OPERATOR_NAME,
    ) ?? [];
    if (others.length === 0) return;
    const allOthersApproved = others.every(
      (a) => a.status === "approved" || a.status === "auto_approved",
    );
    if (!allOthersApproved) return;
    const state = readTourState();
    if (!state.active) return;
    const step = TOUR_STEPS[state.stepIndex];
    if (step?.id !== "approval-simulate-others") return;
    window.dispatchEvent(
      new CustomEvent("tour:auto-next", {
        detail: { fromStepId: "approval-simulate-others" },
      }),
    );
  }, [contract]);

  if (contract === null) {
    return (
      <>
        <Header title="Contract" subtitle="Loading..." />
      </>
    );
  }
  if (!contract) {
    return (
      <>
        <Header title="Contract not found" subtitle={id} />
        <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <Link href="/" className="text-sm text-ink-700 hover:underline">Back to dashboard</Link>
        </div>
      </>
    );
  }

  const template = getTemplate(contract.templateId);
  const source = findSourceRecord(contract.sourceRecordId);
  if (!template || !source) return null;

  const handleApprove = (a: Approval) => {
    // The assigned individual is resolved at routing time by the approver-directory.
    // We record exactly who decided so the audit trail names the real person, not the role.
    // assignedUserId disambiguates committee members so e.g. Astrid approving
    // Board does not auto-clear Christian's and Emma's pending entries.
    const decidedBy = a.assignedName
      ? a.delegateOfName
        ? `${a.assignedName} (delegating for ${a.delegateOfName})`
        : a.assignedName
      : a.role;
    approve(contract.id, a.role, decidedBy, a.assignedUserId);
    refresh();
  };

  // Only the operator (simulated as Martina Holst in this demo) can withdraw
  // their own approval, and only before the envelope has been sent. That keeps
  // the audit trail honest: an operator cannot un-approve someone else's row.
  const canUndoApprove = (a: Approval) => {
    if (a.status !== "approved") return false;
    if (contract.stage === "sent" || contract.stage === "signed" || contract.stage === "filed") return false;
    return a.decidedBy?.startsWith(OPERATOR_NAME) ?? false;
  };

  const handleUndoApprove = (a: Approval) => {
    undoApproval({
      contractId: contract.id,
      role: a.role,
      assignedUserId: a.assignedUserId,
      byUserName: OPERATOR_NAME,
    });
    refresh();
  };

  const handleReping = (a: Approval) => {
    repingApproval({
      contractId: contract.id,
      role: a.role,
      assignedUserId: a.assignedUserId,
      byUserName: OPERATOR_NAME,
    });
    refresh();
  };

  const handleReassignConfirm = (input: { newUserId: string; reason: string; intent: "reassign" | "pass_on" }) => {
    if (!reassignFor) return;
    reassignApproval({
      contractId: contract.id,
      role: reassignFor.role,
      currentAssignedUserId: reassignFor.assignedUserId,
      newUserId: input.newUserId,
      reason: input.reason,
      byUserName: input.intent === "pass_on" ? (reassignFor.assignedName ?? OPERATOR_NAME) : OPERATOR_NAME,
      intent: input.intent,
    });
    setReassignFor(null);
    refresh();
  };

  const handleRejectConfirm = (reason: string) => {
    if (!rejectFor) return;
    const decidedBy = rejectFor.assignedName ?? rejectFor.role;
    rejectApproval({
      contractId: contract.id,
      role: rejectFor.role,
      assignedUserId: rejectFor.assignedUserId,
      decidedBy,
      reason,
    });
    setRejectFor(null);
    refresh();
  };

  const handleSend = async () => {
    send(contract.id);
    refresh();
    await new Promise((r) => setTimeout(r, 1200));
    simulateSigned(contract.id);
    refresh();
    setShowPreview(false);
    router.push(`/contracts/${contract.id}/signed`);
  };

  const canSend = contract.stage === "ready_to_send" || (contract.stage === "awaiting_approval" && allApproved(contract.approvals));

  return (
    <>
      <Header
        title={contract.name}
        subtitle={`${template.name} ${template.version} · ${source.system}${source.externalRef ? ` ${source.externalRef}` : ""}`}
        breadcrumb={[
          { label: "Dashboard", href: "/" },
          { label: contract.name },
          { label: "In flight" },
        ]}
        actions={<BackButton fallback="/" label="Back" />}
      />

      <div className="space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <ContractSummary contract={contract} />

        {contract.templateVersion && contract.templateVersion !== template.version && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <div className="font-medium">Master template updated since this contract was drafted</div>
              <div className="mt-0.5 text-[12px] text-amber-800">
                This contract is pinned to <span className="font-mono">{template.id} {contract.templateVersion}</span>.
                The live master is now <span className="font-mono">{template.version}</span>.
                Legal updates to the master do not disrupt in-flight contracts. Restart with the new version if material clauses changed.
              </div>
            </div>
          </div>
        )}

        <div className="tour-anchor-clause-diff">
          <Card title="Clause review" subtitle="Auto-run on intake. Re-runs whenever fields change.">
            <ClauseDiff results={contract.clauseResults ?? []} />
          </Card>
        </div>

        <div className="tour-anchor-routing">
          <Card title="Approval routing" subtitle="Rule-based. Each rule attaches its 'why' so the chain is auditable.">
            <RoutingPanel approvals={contract.approvals ?? []} />
          </Card>
        </div>

        {contract.approvals && contract.approvals.length > 0 && (
          <div className="tour-anchor-approval-chain">
            <Card title="Approval chain" subtitle="Approvers are notified by their channel. Each row has Reassign / Pass on / Re-ping / Reject actions.">
              <ApprovalChain
                approvals={contract.approvals}
                onSimulateApprove={handleApprove}
                onReassign={(a) => setReassignFor(a)}
                onReping={handleReping}
                onReject={(a) => setRejectFor(a)}
                onUndoApprove={handleUndoApprove}
                canUndoApprove={canUndoApprove}
                operatorName={OPERATOR_NAME}
              />
            </Card>
          </div>
        )}

        <Card
          title="Send via DocuSign"
          subtitle="Variables substituted from intake. Anchor tags placed automatically."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                leadingIcon={<Save className="h-3.5 w-3.5" />}
                onClick={() => {
                  saveDraftAndExit(contract.id, OPERATOR_NAME);
                  router.push("/");
                }}
                title="Park this contract and return to the dashboard. Auto-save is already on; this also writes a 'stepped away' audit event."
              >
                Save draft &amp; exit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leadingIcon={<Eye className="h-3.5 w-3.5" />}
                onClick={() => setShowPreview(true)}
                className="tour-anchor-preview-envelope"
              >
                Preview envelope
              </Button>
              <Button
                size="sm"
                leadingIcon={<FileSignature className="h-3.5 w-3.5" />}
                disabled={!canSend}
                onClick={() => setShowPreview(true)}
              >
                Send via DocuSign
              </Button>
            </div>
          }
        >
          {canSend ? (
            <div className="rounded-lg border border-sage-500/30 bg-sage-50 px-4 py-3 text-[13px] text-ink-700">
              All approvals satisfied. Click <strong>Preview envelope</strong> to inspect the populated document with anchor-tag field placement, then send.
            </div>
          ) : (
            <div className="rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-[13px] text-ink-700">
              Send blocked until all approvals complete.{" "}
              {(contract.approvals ?? []).filter((a) => a.status === "pending").length} approval(s) still pending.
            </div>
          )}
          <div className="mt-2 rounded-lg border border-ink-100 bg-white px-4 py-3 text-[11px] text-ink-600">
            <span className="demo-note mr-2">How signers are determined</span>
            <strong>Counterparty:</strong> pulled from the source record (Salesforce / HubSpot / HRIS contact) and validated against the deal. AE cannot freely type an email.{" "}
            <strong>Light side:</strong> {lightSignerRationale(template)}{" "}
            <strong>Defense in depth:</strong> {contract.type === "Employment" ? "SMS OTP identity verification on the candidate." : contract.type === "Warrant" ? "eIDAS QES with ID document verification + witness signer." : "DocuSign Connect bounce/decline webhooks return blocked contracts to the AE if a signer is unreachable."}
          </div>
        </Card>
      </div>

      <DocuSignPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        contract={contract}
        template={template}
        onSend={handleSend}
        onSaveDraft={() => {
          saveDraftAndExit(contract.id, OPERATOR_NAME);
          setShowPreview(false);
          router.push("/");
        }}
        canSend={canSend}
      />

      <ReassignModal
        open={reassignFor !== null}
        approval={reassignFor}
        onClose={() => setReassignFor(null)}
        onConfirm={handleReassignConfirm}
      />

      <RejectModal
        open={rejectFor !== null}
        approval={rejectFor}
        onClose={() => setRejectFor(null)}
        onConfirm={handleRejectConfirm}
      />
    </>
  );
}

function ContractSummary({ contract }: { contract: Contract }) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-400">Counterparty</div>
            <div className="text-[18px] font-semibold tracking-tight text-ink-900">{contract.counterparty}</div>
          </div>
          {contract.valueEur !== undefined && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400">Value</div>
              <div className="text-[18px] font-semibold tabular-nums tracking-tight text-ink-900">{formatEur(contract.valueEur)}</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-500 sm:justify-end">
          <StatusBadge stage={contract.stage} />
          <RiskBadge risk={contract.risk} />
          <Badge tone="slate">{contract.type}</Badge>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink-100 pt-3 text-[11px] text-ink-500">
        <span>
          Owner <span className="font-medium text-ink-700">{contract.owner}</span> ({contract.ownerTeam})
        </span>
        <span>·</span>
        <span>Updated {formatDateTime(contract.updatedAt)}</span>
      </div>
    </Card>
  );
}
