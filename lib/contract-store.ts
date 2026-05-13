"use client";

import type { Contract, Stage, Approval, AuditEvent, ContractFields, LedgerImpact } from "./types";
import { SEED_CONTRACTS, getTemplate, getSourceRecord } from "./mock-data";
import { runChecks } from "./clause-checker";
import { computeRouting, allApproved } from "./routing-rules";
import { primaryLightSignerActor } from "./signer-routing";
import { findMember } from "./approver-directory";

const STORAGE_KEY = "light-documents-state";
// Bump on every shape change to Contract / Approval / seed data so old localStorage
// state is discarded and the demo re-seeds with the current data model.
const STATE_VERSION = 6;

interface StoredState {
  version: number;
  contracts: Record<string, Contract>;
  seededAt: string;
}

/**
 * Explicit state machine. Throws on invalid transitions.
 * Every transition produces a new Contract object plus an audit event.
 */
const VALID_TRANSITIONS: Record<Stage, Stage[]> = {
  draft: ["checks_running", "needs_info"],
  needs_info: ["draft", "checks_running"],
  checks_running: ["in_review", "ready_to_send"],
  in_review: ["awaiting_approval", "draft", "ready_to_send"],
  // awaiting_approval -> needs_info added so a rejection from an approver can
  // bounce the contract back to the owner for fixes rather than blocking forever.
  awaiting_approval: ["ready_to_send", "in_review", "needs_info"],
  ready_to_send: ["sent"],
  sent: ["signed"],
  signed: ["filed"],
  filed: [],
};

function isValidTransition(from: Stage, to: Stage): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

function now(): string {
  return new Date().toISOString();
}

function appendAudit(contract: Contract, event: AuditEvent): Contract {
  return {
    ...contract,
    audit: [...contract.audit, event],
    updatedAt: event.at,
  };
}

// ── Storage adapter ──────────────────────────────────────────────────────────

function readState(): StoredState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (parsed.version !== STATE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeState(state: StoredState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function seedState(): StoredState {
  const contracts: Record<string, Contract> = {};
  for (const c of SEED_CONTRACTS) {
    contracts[c.id] = c;
  }
  return { version: STATE_VERSION, contracts, seededAt: now() };
}

export function ensureSeeded(): StoredState {
  const existing = readState();
  if (existing) return existing;
  const fresh = seedState();
  writeState(fresh);
  return fresh;
}

export function resetDemo(): StoredState {
  const fresh = seedState();
  writeState(fresh);
  return fresh;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export function listContracts(): Contract[] {
  const state = ensureSeeded();
  return Object.values(state.contracts).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getContract(id: string): Contract | undefined {
  const state = ensureSeeded();
  return state.contracts[id];
}

// ── Commands (each returns the updated contract, never mutates) ──────────────

export function saveContract(contract: Contract): Contract {
  const state = ensureSeeded();
  const next: StoredState = {
    ...state,
    contracts: { ...state.contracts, [contract.id]: contract },
  };
  writeState(next);
  return contract;
}

export function createContract(input: {
  templateId: Contract["templateId"];
  sourceRecordId: string;
  owner: string;
  ownerTeam: string;
  fields: ContractFields;
}): Contract {
  const template = getTemplate(input.templateId);
  const sourceRecord = getSourceRecord(input.sourceRecordId);
  if (!template) throw new Error(`Unknown template: ${input.templateId}`);
  if (!sourceRecord) throw new Error(`Unknown source record: ${input.sourceRecordId}`);

  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const counterparty =
    input.fields.counterpartyLegalName ??
    input.fields.candidateName ??
    input.fields.stakeholderName ??
    input.fields.vendorName ??
    sourceRecord.display;

  const valueEur =
    input.fields.contractValueEur ??
    input.fields.salaryEur ??
    (input.fields.monthlySpendEur ? input.fields.monthlySpendEur * 12 : undefined);

  const contract: Contract = {
    id,
    name: `${counterparty} ${template.type}`,
    type: template.type,
    templateId: template.id,
    // Pin the master template version at create time. Counsel updates the master
    // mid-flow do not disrupt this contract; the detail page surfaces a banner
    // when live template version differs from the pinned one.
    templateVersion: template.version,
    sourceRecordId: sourceRecord.id,
    counterparty,
    owner: input.owner,
    ownerTeam: input.ownerTeam,
    valueEur,
    risk: template.risk,
    stage: "draft",
    createdAt: now(),
    updatedAt: now(),
    fields: input.fields,
    audit: [
      {
        at: now(),
        actor: `${input.owner} (${input.ownerTeam})`,
        event: `Contract created from ${sourceRecord.system} ${sourceRecord.externalRef ?? sourceRecord.id}`,
      },
    ],
  };

  return saveContract(contract);
}

export function runClauseChecks(id: string): Contract {
  const contract = getContract(id);
  if (!contract) throw new Error(`Contract not found: ${id}`);
  if (!isValidTransition(contract.stage, "checks_running")) {
    throw new Error(`Cannot run checks from stage: ${contract.stage}`);
  }
  const template = getTemplate(contract.templateId);
  if (!template) throw new Error(`Template not found: ${contract.templateId}`);

  const results = runChecks(template, contract.fields);
  const approvals = computeRouting(template, contract.fields, results);

  const nextStage: Stage = approvals.length === 0 || allApproved(approvals) ? "ready_to_send" : "in_review";

  const checkedContract = appendAudit(
    {
      ...contract,
      stage: "checks_running",
      clauseResults: results,
      approvals,
    },
    {
      at: now(),
      actor: "system",
      event: `Clause check complete: ${results.filter((r) => r.status === "deviation").length} deviation${results.filter((r) => r.status === "deviation").length === 1 ? "" : "s"}, ${approvals.length} approval${approvals.length === 1 ? "" : "s"} required`,
    },
  );

  const finalContract = appendAudit(
    { ...checkedContract, stage: nextStage },
    {
      at: now(),
      actor: "system",
      event: nextStage === "ready_to_send" ? "All approvals satisfied. Ready to send." : "Routed for approval.",
    },
  );

  return saveContract(finalContract);
}

export function approve(
  id: string,
  role: Approval["role"],
  decidedBy: string,
  assignedUserId?: string,
): Contract {
  const contract = getContract(id);
  if (!contract) throw new Error(`Contract not found: ${id}`);
  const approvals = contract.approvals ?? [];
  // Match by (role, assignedUserId) so committees (Board) require independent
  // approval from every member. When assignedUserId is omitted (legacy callers),
  // fall back to the original role-only match.
  const next = approvals.map((a) => {
    if (a.role !== role) return a;
    if (assignedUserId !== undefined && a.assignedUserId !== assignedUserId) return a;
    return { ...a, status: "approved" as const, decidedAt: now(), decidedBy };
  });

  const audited = appendAudit(
    { ...contract, approvals: next },
    { at: now(), actor: `${decidedBy} (${role})`, event: `Approved` },
  );

  if (allApproved(next) && isValidTransition(audited.stage, "ready_to_send")) {
    return saveContract(
      appendAudit(
        { ...audited, stage: "ready_to_send" },
        { at: now(), actor: "system", event: "All approvals satisfied. Ready to send." },
      ),
    );
  }

  return saveContract(audited);
}

// ── Workflow actions on the approval chain ─────────────────────────────────────

/**
 * Reassign or pass-on a pending approval to a different member.
 *
 * Matches the row by (role, currentAssignedUserId) so committee rows (Board)
 * route correctly. Updates the assignedName/Title/Email/AvatarColor by looking
 * the new member up in the approver-directory, sets a `selectionReason` that
 * records the override, and appends two audit events: the override itself and
 * a simulated Slack DM to the new approver.
 *
 * For an interview demo this is what makes the chain feel real: an operator
 * can intervene, the audit trail captures the override + reason, and the next
 * approver is notified on the channel the role's group declared.
 */
export function reassignApproval(input: {
  contractId: string;
  role: Approval["role"];
  currentAssignedUserId?: string;
  newUserId: string;
  reason: string;
  byUserName: string;
  intent?: "reassign" | "pass_on";
}): Contract {
  const contract = getContract(input.contractId);
  if (!contract) throw new Error(`Contract not found: ${input.contractId}`);
  const newMember = findMember(input.newUserId);
  if (!newMember) throw new Error(`Approver not found: ${input.newUserId}`);

  const approvals = contract.approvals ?? [];
  let oldName = "";
  let updated = false;

  const next = approvals.map((a) => {
    if (a.role !== input.role) return a;
    if (input.currentAssignedUserId !== undefined && a.assignedUserId !== input.currentAssignedUserId) return a;
    if (a.status === "approved" || a.status === "auto_approved" || a.status === "rejected") return a;
    if (updated) return a; // only update the first matching row
    updated = true;
    oldName = a.assignedName ?? a.role;
    const intent = input.intent ?? "reassign";
    const verb = intent === "pass_on" ? "Passed on" : "Reassigned";
    return {
      ...a,
      assignedUserId: newMember.userId,
      assignedName: newMember.name,
      assignedTitle: newMember.title,
      assignedEmail: newMember.email,
      assignedAvatarColor: newMember.avatarColor,
      selectionReason: `${verb} from ${oldName} by ${input.byUserName}. Reason: ${input.reason}`,
      delegateOfUserId: intent === "pass_on" ? input.currentAssignedUserId : a.delegateOfUserId,
      delegateOfName: intent === "pass_on" ? oldName : a.delegateOfName,
    };
  });

  if (!updated) {
    throw new Error(`No pending ${input.role} approval found to reassign`);
  }

  const intent = input.intent ?? "reassign";
  const verb = intent === "pass_on" ? "passed on" : "reassigned";
  const withOverride = appendAudit(
    { ...contract, approvals: next },
    {
      at: now(),
      actor: `${input.byUserName}${intent === "pass_on" ? "" : " (operator)"}`,
      event: `${input.role} approval ${verb} from ${oldName} to ${newMember.name}`,
      meta: input.reason,
    },
  );
  const withNotification = appendAudit(withOverride, {
    at: now(),
    actor: "system",
    event: `Slack DM sent to ${newMember.name} (${input.role})`,
    meta: `Channel: ${approvals.find((a) => a.role === input.role)?.channel ?? "Slack DM"}`,
  });

  return saveContract(withNotification);
}

/**
 * Reject a pending approval. The approver's row goes to status=rejected and
 * the contract transitions back to needs_info so the owner can fix and re-run
 * checks. Two audit events fire: the rejection (with reason) and a simulated
 * Slack DM to the contract owner.
 */
export function rejectApproval(input: {
  contractId: string;
  role: Approval["role"];
  assignedUserId?: string;
  decidedBy: string;
  reason: string;
}): Contract {
  const contract = getContract(input.contractId);
  if (!contract) throw new Error(`Contract not found: ${input.contractId}`);
  const approvals = contract.approvals ?? [];
  let updated = false;

  const next = approvals.map((a) => {
    if (a.role !== input.role) return a;
    if (input.assignedUserId !== undefined && a.assignedUserId !== input.assignedUserId) return a;
    if (a.status !== "pending") return a;
    if (updated) return a;
    updated = true;
    return { ...a, status: "rejected" as const, decidedAt: now(), decidedBy: input.decidedBy };
  });

  if (!updated) {
    throw new Error(`No pending ${input.role} approval found to reject`);
  }

  let working = appendAudit(
    { ...contract, approvals: next },
    {
      at: now(),
      actor: `${input.decidedBy} (${input.role})`,
      event: `Rejected ${input.role} approval`,
      meta: input.reason,
    },
  );

  if (isValidTransition(working.stage, "needs_info")) {
    working = appendAudit(
      { ...working, stage: "needs_info" },
      {
        at: now(),
        actor: "system",
        event: "Contract returned to owner: needs info",
        meta: `Rejected by ${input.decidedBy}`,
      },
    );
  }

  working = appendAudit(working, {
    at: now(),
    actor: "system",
    event: `Slack DM sent to ${working.owner} (rejection)`,
    meta: `Action required: address ${input.role} feedback`,
  });

  return saveContract(working);
}

/**
 * Re-send the notification to a pending approver. No state change; pure audit
 * event so the trail shows that the owner nudged the approver, and the timing
 * of nudges is preserved for cycle-time reporting.
 */
export function repingApproval(input: {
  contractId: string;
  role: Approval["role"];
  assignedUserId?: string;
  byUserName: string;
}): Contract {
  const contract = getContract(input.contractId);
  if (!contract) throw new Error(`Contract not found: ${input.contractId}`);
  const approval = (contract.approvals ?? []).find((a) =>
    a.role === input.role
    && (input.assignedUserId === undefined || a.assignedUserId === input.assignedUserId)
    && a.status === "pending"
  );
  if (!approval) {
    throw new Error(`No pending ${input.role} approval found to re-ping`);
  }

  const audited = appendAudit(contract, {
    at: now(),
    actor: `${input.byUserName} (operator)`,
    event: `Re-pinged ${approval.assignedName ?? input.role} for ${input.role} approval`,
    meta: `Channel: ${approval.channel}`,
  });
  const withDm = appendAudit(audited, {
    at: now(),
    actor: "system",
    event: `Slack DM re-sent to ${approval.assignedName ?? input.role}`,
    meta: `Reminder: ${input.role} approval pending`,
  });

  return saveContract(withDm);
}

/**
 * Save-and-park: the owner steps away from a contract that is still in flight
 * (draft / in_review / awaiting_approval / ready_to_send). No state transition
 * because the contract is already persisted on every command. This is purely
 * an audit-trail signal that the owner consciously parked the contract and
 * intends to come back; useful for analytics on "stale drafts" and for
 * triggering a follow-up Slack DM to the owner in production.
 */
export function saveDraftAndExit(id: string, byUserName: string): Contract {
  const contract = getContract(id);
  if (!contract) throw new Error(`Contract not found: ${id}`);
  if (contract.stage === "signed" || contract.stage === "filed" || contract.stage === "sent") {
    // Nothing meaningful to "save"; just return.
    return contract;
  }
  const audited = appendAudit(contract, {
    at: now(),
    actor: `${byUserName} (owner)`,
    event: `Saved draft for later — owner stepped away`,
    meta: `Stage: ${contract.stage}`,
  });
  return saveContract(audited);
}

export function send(id: string): Contract {
  const contract = getContract(id);
  if (!contract) throw new Error(`Contract not found: ${id}`);
  if (!isValidTransition(contract.stage, "sent")) {
    throw new Error(`Cannot send from stage: ${contract.stage}`);
  }
  const envelopeId = `DS-${Math.floor(70000 + Math.random() * 9999)}`;
  return saveContract(
    appendAudit(
      { ...contract, stage: "sent", envelopeId },
      {
        at: now(),
        actor: `${contract.owner} (${contract.ownerTeam})`,
        event: `Sent via DocuSign`,
        meta: `Envelope ${envelopeId}`,
      },
    ),
  );
}

export function simulateSigned(id: string): Contract {
  const contract = getContract(id);
  if (!contract) throw new Error(`Contract not found: ${id}`);

  let working = contract;
  if (isValidTransition(working.stage, "signed")) {
    working = appendAudit(
      { ...working, stage: "signed", signedAt: now() },
      {
        at: now(),
        actor: `${working.counterparty} (counterparty)`,
        event: "Signed by counterparty",
      },
    );
    const template = getTemplate(working.templateId);
    const lightActor = template ? primaryLightSignerActor(working, template) : "Light authorised signatory";
    working = appendAudit(working, {
      at: now(),
      actor: lightActor,
      event: "Signed by Light",
    });
  }

  if (isValidTransition(working.stage, "filed")) {
    const ledger = buildLedgerImpact(working);
    working = appendAudit(
      { ...working, stage: "filed", ledger },
      {
        at: now(),
        actor: "system",
        event: "Filed to Drive, ledger updated",
        meta: ledger.headline,
      },
    );
  }

  return saveContract(working);
}

function buildLedgerImpact(contract: Contract): LedgerImpact {
  const t = contract.type;
  const f = contract.fields;
  if (t === "MSA") {
    const arr = f.contractValueEur ?? 0;
    const mrr = Math.round(arr / 12);
    return {
      headline: `+€${mrr.toLocaleString()} MRR booked to ${contract.counterparty}`,
      rows: [
        { label: "MRR change", value: `+€${mrr.toLocaleString()}`, note: "Light ledger entry created" },
        { label: "ARR", value: `€${arr.toLocaleString()}` },
        { label: "Contract start", value: f.effectiveDate ?? "TBD", note: "Invoice schedule generated" },
        { label: "Renewal", value: "Calendar alert created", note: "60 days before term end" },
        { label: "Linked", value: contract.sourceRecordId, note: "Two-way sync established with source system" },
      ],
    };
  }
  if (t === "Employment") {
    return {
      headline: `Headcount +1: ${contract.counterparty} starting ${f.startDate ?? "TBD"}`,
      rows: [
        { label: "Role", value: f.role ?? "" },
        { label: "Base salary", value: `€${(f.salaryEur ?? 0).toLocaleString()} annual` },
        { label: "Variable", value: `${f.variablePct ?? 0}%`, note: f.variablePct ? "OTE calculated" : "Fixed base only" },
        { label: "Start date", value: f.startDate ?? "TBD", note: "Payroll updated" },
        { label: "Equity", value: f.equityBps ? `${(f.equityBps / 100).toFixed(2)}%` : "None", note: f.equityBps ? "Cap table updated" : "No equity component" },
      ],
    };
  }
  if (t === "Warrant") {
    return {
      headline: `Warrant granted: ${f.warrantPct ?? 0}% to ${contract.counterparty}`,
      rows: [
        { label: "Grant", value: `${f.warrantPct ?? 0}%` },
        { label: "Vesting", value: `${f.vestingMonths ?? 48} months` },
        { label: "Cliff", value: `${f.cliffMonths ?? 12} months` },
        { label: "Board resolution", value: f.boardResolutionRef ?? "Pending" },
        { label: "Cap table", value: "Updated", note: "Stakeholder record linked" },
      ],
    };
  }
  if (t === "Order Form") {
    const total = f.orderTotalEur ?? 0;
    const mrr = Math.round(total / (f.termMonths ?? 12));
    return {
      headline: `+€${mrr.toLocaleString()} MRR booked (expansion via Order Form)`,
      rows: [
        { label: "Order total", value: `€${total.toLocaleString()}`, note: "Light ledger entry created" },
        { label: "MRR delta", value: `+€${mrr.toLocaleString()}`, note: `Spread over ${f.termMonths ?? 12} months` },
        { label: "Reference MSA", value: f.referenceMsaId ?? "—", note: "Linked to existing MSA record" },
        { label: "Billing", value: f.billingFrequency ?? "annual" },
        { label: "Seats", value: f.seatCount ? String(f.seatCount) : "—", note: f.seatCount ? "Provisioned in product" : undefined },
      ],
    };
  }
  return {
    headline: `${contract.name} filed`,
    rows: [{ label: "Type", value: t }, { label: "Counterparty", value: contract.counterparty }],
  };
}

// ── Helpers for filters ──────────────────────────────────────────────────────

export function isBlocked(c: Contract): boolean {
  if (c.stage === "awaiting_approval" && (c.approvals ?? []).some((a) => a.status === "pending")) return true;
  if (c.stage === "in_review") return true;
  if (c.stage === "sent" && c.signedAt === undefined) {
    const sentDays = (Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (sentDays > 7) return true;
  }
  return false;
}

export function isAwaitingMe(c: Contract, role: string): boolean {
  return (c.approvals ?? []).some((a) => a.role === role && a.status === "pending");
}

export function isSignedThisWeek(c: Contract): boolean {
  if (!c.signedAt) return false;
  const days = (Date.now() - new Date(c.signedAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
}

export function computeKpis(contracts: Contract[]): {
  inFlight: number;
  blocked: number;
  signedThisWeek: number;
  avgCycleDays: number;
} {
  const inFlight = contracts.filter((c) => c.stage !== "filed" && c.stage !== "signed").length;
  const blocked = contracts.filter(isBlocked).length;
  const signedThisWeek = contracts.filter(isSignedThisWeek).length;
  const filed = contracts.filter((c) => c.signedAt && c.stage === "filed");
  const avgCycleDays =
    filed.length === 0
      ? 0
      : Math.round(
          filed.reduce((sum, c) => {
            const start = new Date(c.createdAt).getTime();
            const end = new Date(c.signedAt as string).getTime();
            return sum + (end - start) / (1000 * 60 * 60 * 24);
          }, 0) / filed.length,
        );
  return { inFlight, blocked, signedThisWeek, avgCycleDays };
}
