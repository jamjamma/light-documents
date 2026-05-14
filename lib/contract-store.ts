"use client";

import type { Contract, Stage, Approval, AuditEvent, ContractFields, LedgerImpact } from "./types";
import { SEED_CONTRACTS, getTemplate } from "./mock-data";
import { runChecks } from "./clause-checker";
import { computeRouting, allApproved } from "./routing-rules";
import { primaryLightSignerActor } from "./signer-routing";
import { findMember } from "./approver-directory";

const STORAGE_KEY = "light-documents-state";
// Bump on every shape change to Contract / Approval / seed data so old localStorage
// state is discarded and the demo re-seeds with the current data model.
const STATE_VERSION = 10;

export interface RogueAction {
  archived?: { at: string; by: string };
  notified?: {
    at: string;
    by: string;
    channel: "slack_dm" | "slack_channel" | "email";
    recipient: string; // person or channel display name
  };
}

interface StoredState {
  version: number;
  contracts: Record<string, Contract>;
  /**
   * Source records added at runtime via "Add manually" in the new-contract
   * flow. Persisted separately from the seed SOURCE_RECORDS so reset clears
   * them without touching the mock data.
   */
  manualSourceRecords?: import("./types").SourceRecord[];
  /**
   * Per-rogue-template actions taken by the operator (archive / notify).
   * Keyed by driveFileId. Cleared on reset.
   */
  rogueActions?: Record<string, RogueAction>;
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
    // Backfill the ledger for already-filed seed contracts so they render
    // the same realistic GL journal entry (or HRIS / cap-table block) as
    // contracts signed live during the demo. The seed contracts predate the
    // journalEntry/hrisRecord/capTableDelta extension and would otherwise
    // show only the flat summary rows.
    const needsLedger = (c.stage === "filed" || c.stage === "signed") && c.type !== "NDA";
    const ledger = needsLedger ? buildLedgerImpact(c) ?? c.ledger : c.ledger;
    contracts[c.id] = ledger ? { ...c, ledger } : c;
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

// ── Source records (mock + manually added) ───────────────────────────────────

import type { SourceRecord } from "./types";
import { SOURCE_RECORDS } from "./mock-data";

/** All source records: seeded mock data plus any manual entries from localStorage. */
export function listAllSourceRecords(): SourceRecord[] {
  const state = ensureSeeded();
  return [...SOURCE_RECORDS, ...(state.manualSourceRecords ?? [])];
}

/**
 * Look up a source record by id across BOTH the seeded mock data and any
 * manually entered records persisted in localStorage. The plain
 * `getSourceRecord` exported by `mock-data.ts` only sees the seed array, so
 * any caller that may receive a manual-entry id must use this function
 * instead. (Contract creation and the contract detail page both qualify.)
 */
export function findSourceRecord(id: string): SourceRecord | undefined {
  return listAllSourceRecords().find((r) => r.id === id);
}

export function listSourceRecordsByType(type: SourceRecord["type"]): SourceRecord[] {
  return listAllSourceRecords().filter((r) => r.type === type);
}

/**
 * Persist a new manually-entered source record. Generates an id + syncedAt
 * if not provided. New records show up immediately in the picker.
 *
 * In production this would also write a Salesforce/HRIS "manual record"
 * placeholder so downstream systems see the source-of-truth.
 */
export function addManualSourceRecord(input: Omit<SourceRecord, "id" | "syncedAt" | "system"> & { system?: SourceRecord["system"] }): SourceRecord {
  const state = ensureSeeded();
  const id = `src_manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record: SourceRecord = {
    ...input,
    id,
    system: input.system ?? "Manual entry",
    syncedAt: now(),
  };
  const next: StoredState = {
    ...state,
    manualSourceRecords: [...(state.manualSourceRecords ?? []), record],
  };
  writeState(next);
  return record;
}

// ── Rogue templates: archive / notify actions ─────────────────────────────────

/**
 * Returns the action taken on a given rogue template, or an empty object if
 * nothing has been done yet. Reads from localStorage so the operator's prior
 * decisions persist across reloads.
 */
export function getRogueAction(driveFileId: string): RogueAction {
  const state = ensureSeeded();
  return state.rogueActions?.[driveFileId] ?? {};
}

export function listRogueActions(): Record<string, RogueAction> {
  const state = ensureSeeded();
  return state.rogueActions ?? {};
}

function patchRogueAction(driveFileId: string, patch: RogueAction | null): RogueAction {
  const state = ensureSeeded();
  const existing = state.rogueActions ?? {};
  let nextActions: Record<string, RogueAction>;
  if (patch === null) {
    const { [driveFileId]: _, ...rest } = existing;
    nextActions = rest;
  } else {
    nextActions = {
      ...existing,
      [driveFileId]: { ...existing[driveFileId], ...patch },
    };
  }
  writeState({ ...state, rogueActions: nextActions });
  return nextActions[driveFileId] ?? {};
}

/**
 * Archive a rogue template. In the demo this just records the action locally;
 * in production this would:
 *   1. Move the docx in Drive to /Master Templates/_rogue-archive/<year>/
 *   2. Write a "rogue-archived" audit event to the platform's audit log
 *   3. If anyone still has the file open, surface a banner in Drive
 *      ("this file was archived by Head of F&O — use the master MSA instead")
 */
export function archiveRogue(driveFileId: string, byUserName: string): RogueAction {
  return patchRogueAction(driveFileId, { archived: { at: now(), by: byUserName } });
}

export function undoArchiveRogue(driveFileId: string): RogueAction {
  const state = ensureSeeded();
  const existing = state.rogueActions?.[driveFileId];
  if (!existing) return {};
  const { archived: _drop, ...rest } = existing;
  if (Object.keys(rest).length === 0) {
    return patchRogueAction(driveFileId, null);
  }
  // Replace wholesale (not merge) so `archived` is removed cleanly.
  const nextActions = { ...(state.rogueActions ?? {}), [driveFileId]: rest };
  writeState({ ...state, rogueActions: nextActions });
  return rest;
}

/**
 * Notify the file owner via Slack. In the demo we record who would be DM'd;
 * in production this would post to the Slack Web API:
 *   - chat.postMessage to the owner's DM channel (or #legal-rogue-templates
 *     fallback if the user has DMs disabled / has left the company)
 *   - Message template includes: file name, similarity score, diff summary,
 *     recommended action, deep link back to /templates#<driveFileId>, and
 *     interactive Approve / Pass-on buttons that round-trip via Slack's
 *     Interactivity Request URL.
 */
export function notifyRogueOwner(input: {
  driveFileId: string;
  byUserName: string;
  channel: NonNullable<RogueAction["notified"]>["channel"];
  recipient: string;
}): RogueAction {
  return patchRogueAction(input.driveFileId, {
    notified: {
      at: now(),
      by: input.byUserName,
      channel: input.channel,
      recipient: input.recipient,
    },
  });
}

export function undoNotifyRogue(driveFileId: string): RogueAction {
  const state = ensureSeeded();
  const existing = state.rogueActions?.[driveFileId];
  if (!existing) return {};
  const { notified: _drop, ...rest } = existing;
  if (Object.keys(rest).length === 0) {
    return patchRogueAction(driveFileId, null);
  }
  const nextActions = { ...(state.rogueActions ?? {}), [driveFileId]: rest };
  writeState({ ...state, rogueActions: nextActions });
  return rest;
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
  const sourceRecord = findSourceRecord(input.sourceRecordId);
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

/**
 * Reverse an approval the operator made and didn't want to commit to. Only the
 * person who decided can withdraw it (defense against unrelated approvers being
 * un-approved); enforced at the call site by matching `byUserName` against
 * `decidedBy`.
 *
 * If the contract had already advanced to `ready_to_send` because this was the
 * last pending approval, walk it back to `awaiting_approval`. We do not undo
 * a send; once the envelope is in DocuSign the workflow is out of our hands.
 */
export function undoApproval(input: {
  contractId: string;
  role: Approval["role"];
  assignedUserId?: string;
  byUserName: string;
}): Contract {
  const contract = getContract(input.contractId);
  if (!contract) throw new Error(`Contract not found: ${input.contractId}`);
  if (contract.stage === "sent" || contract.stage === "signed" || contract.stage === "filed") {
    throw new Error("Cannot undo approval after the envelope has been sent");
  }

  const approvals = contract.approvals ?? [];
  const target = approvals.find((a) => {
    if (a.role !== input.role) return false;
    if (input.assignedUserId !== undefined && a.assignedUserId !== input.assignedUserId) return false;
    return a.status === "approved";
  });
  if (!target) throw new Error("No matching approved row to undo");
  // Only the person who decided can withdraw it. Operators withdrawing
  // someone else's approval would erode the audit trail; route them through
  // reassign / re-ping instead.
  if (target.decidedBy && !target.decidedBy.startsWith(input.byUserName)) {
    throw new Error("Only the approver can withdraw their own approval");
  }

  const next = approvals.map((a) => {
    if (a !== target) return a;
    const { decidedAt: _at, decidedBy: _by, ...rest } = a;
    return { ...rest, status: "pending" as const };
  });

  // If we previously advanced to ready_to_send because everyone approved, walk
  // back to awaiting_approval since the chain is no longer complete.
  const wasReady = contract.stage === "ready_to_send" && !allApproved(next);
  const stage: Stage = wasReady ? "awaiting_approval" : contract.stage;

  const audited = appendAudit(
    { ...contract, approvals: next, stage },
    {
      at: now(),
      actor: `${input.byUserName} (${input.role})`,
      event: `Withdrew approval`,
      meta: wasReady ? "Chain no longer complete; back to awaiting approval" : undefined,
    },
  );

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
  const channel = approvals.find((a) => a.role === input.role)?.channel ?? "Slack DM";

  // 1. Override event itself.
  let working = appendAudit(
    { ...contract, approvals: next },
    {
      at: now(),
      actor: `${input.byUserName}${intent === "pass_on" ? "" : " (operator)"}`,
      event: `${input.role} approval ${verb} from ${oldName} to ${newMember.name}`,
      meta: input.reason,
    },
  );

  // 2. Notification fan-out. The matrix:
  //   Reassign: new approver (action) + previous assignee (removed from queue) + contract owner (chain changed).
  //   Pass on:  new approver (action + "covering for X") + contract owner (FYI) + Head of F&O (queue-mgmt signal).
  // The operator who initiated a Reassign is presumed present (they clicked the button); same for the assignee who passed on.
  const newDm = intent === "pass_on"
    ? `Slack DM sent to ${newMember.name} (${input.role}), covering for ${oldName}`
    : `Slack DM sent to ${newMember.name} (${input.role})`;
  working = appendAudit(working, {
    at: now(),
    actor: "system",
    event: newDm,
    meta: `Channel: ${channel}`,
  });

  if (intent === "reassign") {
    // Tell the previous assignee they're off the hook.
    working = appendAudit(working, {
      at: now(),
      actor: "system",
      event: `Slack DM sent to ${oldName}: removed from your queue`,
      meta: `Reassigned to ${newMember.name} by ${input.byUserName}`,
    });
  } else {
    // Pass-on: surface to Head of F&O for queue management.
    working = appendAudit(working, {
      at: now(),
      actor: "system",
      event: `Slack DM sent to Head of Finance & Ops: pass-on logged`,
      meta: `${oldName} passed ${input.role} to ${newMember.name}. Workload + specialty signal.`,
    });
  }

  // Contract owner always gets a chain-changed FYI when they didn't initiate the action.
  if (working.owner !== input.byUserName) {
    working = appendAudit(working, {
      at: now(),
      actor: "system",
      event: `Slack DM sent to ${working.owner}: approval chain updated`,
      meta: `${input.role}: ${oldName} → ${newMember.name} (${intent === "pass_on" ? "pass-on" : "reassign"})`,
    });
  }

  return saveContract(working);
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
    event: `Saved draft for later (owner stepped away)`,
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
      { ...working, stage: "filed", ...(ledger ? { ledger } : {}) },
      {
        at: now(),
        actor: "system",
        event: ledger ? "Filed to Drive, ledger updated" : "Filed to Drive (retention only, no ledger writeback)",
        meta: ledger?.headline,
      },
    );
  }

  return saveContract(working);
}

/**
 * Fast-forward a contract through the entire workflow to its `filed` state.
 *
 * Used by the tour menu to set up preconditions for chapters that start on
 * a signed/filed page (e.g. "Signed record", "Signed archive"). Without
 * this, picking those chapters would land the user on a page that shows
 * an in-flight contract whose signed banner, full audit trail, and ledger
 * writeback all don't exist yet.
 *
 * Idempotent: a contract already in `filed` stage is returned unchanged.
 * Approvals get auto-approved (operator = "system" for the audit actor)
 * so the chain doesn't block on missing decision rows; the per-approver
 * rows still appear in the audit trail.
 */
export function fastForwardToFiled(id: string): Contract {
  const contract = getContract(id);
  if (!contract) throw new Error(`Contract not found: ${id}`);
  if (contract.stage === "filed") return contract;

  // 1. Approve any pending approvers. Each call appends an audit row and
  //    transitions to `ready_to_send` once the chain is satisfied.
  const pending = (contract.approvals ?? []).filter((a) => a.status === "pending");
  for (const a of pending) {
    // approve() reads the freshest contract internally so this loop stays
    // correct even after the previous iteration's save.
    approve(id, a.role, a.assignedName ?? a.role, a.assignedUserId);
  }

  // 2. Send (only valid from ready_to_send).
  const afterApprove = getContract(id);
  if (afterApprove && isValidTransition(afterApprove.stage, "sent")) {
    send(id);
  }

  // 3. simulateSigned walks sent → signed → filed with ledger writeback.
  return simulateSigned(id);
}

export function buildLedgerImpact(contract: Contract): LedgerImpact | null {
  const t = contract.type;
  const f = contract.fields;
  // NDAs are retention-only: no MRR, headcount, equity, or cap-table impact.
  // The audit trail above is the system of record. Surfacing a "ledger
  // writeback" panel for an NDA would be misleading in the demo and wrong
  // in production.
  if (t === "NDA") return null;
  if (t === "MSA") {
    const arr = f.contractValueEur ?? 0;
    const mrr = Math.round(arr / 12);
    const renewalDate = computeRenewalDate(f.effectiveDate, f.termMonths ?? 12);
    return {
      headline: `+€${mrr.toLocaleString()} MRR booked to ${contract.counterparty}`,
      rows: [
        { label: "MRR change", value: `+€${mrr.toLocaleString()}`, note: "Posted to Light ledger" },
        { label: "ARR", value: `€${arr.toLocaleString()}` },
        { label: "Contract start", value: f.effectiveDate ?? "TBD", note: "Invoice schedule generated" },
        { label: "Renewal", value: renewalDate, note: "Calendar alert set 60 days before" },
        { label: "Linked source", value: contract.sourceRecordId, note: "Two-way sync to source system" },
      ],
      journalEntry: {
        entryNumber: ledgerEntryNumber(contract),
        postedAt: contract.signedAt ?? now(),
        debit: { account: "1200 · Trade Receivables", amount: `€${arr.toLocaleString()}` },
        credit: { account: "2400 · Deferred Revenue", amount: `€${arr.toLocaleString()}` },
        dimensions: [
          { label: "Customer", value: contract.counterparty },
          { label: "Source record", value: contract.sourceRecordId },
          { label: "Entity", value: f.lightEntity ?? "Light ApS (Denmark)" },
          { label: "Renewal", value: renewalDate },
        ],
      },
    };
  }
  if (t === "Order Form") {
    const total = f.orderTotalEur ?? 0;
    const mrr = Math.round(total / (f.termMonths ?? 12));
    return {
      headline: `+€${mrr.toLocaleString()} MRR booked (expansion via Order Form)`,
      rows: [
        { label: "Order total", value: `€${total.toLocaleString()}`, note: "Posted to Light ledger" },
        { label: "MRR delta", value: `+€${mrr.toLocaleString()}`, note: `Spread over ${f.termMonths ?? 12} months` },
        { label: "Reference MSA", value: f.referenceMsaId ?? "—", note: "Linked to existing MSA record" },
        { label: "Billing", value: f.billingFrequency ?? "annual" },
        { label: "Seats", value: f.seatCount ? String(f.seatCount) : "—", note: f.seatCount ? "Provisioned in product" : undefined },
      ],
      journalEntry: {
        entryNumber: ledgerEntryNumber(contract),
        postedAt: contract.signedAt ?? now(),
        debit: { account: "1200 · Trade Receivables", amount: `€${total.toLocaleString()}` },
        credit: { account: "2400 · Deferred Revenue", amount: `€${total.toLocaleString()}` },
        dimensions: [
          { label: "Customer", value: contract.counterparty },
          { label: "Parent MSA", value: f.referenceMsaId ?? "—" },
          { label: "Source record", value: contract.sourceRecordId },
          { label: "Entity", value: f.lightEntity ?? "Light ApS (Denmark)" },
        ],
      },
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
      hrisRecord: {
        employeeId: hrisEmployeeId(contract),
        payrollUpdate: `Effective ${f.startDate ?? "TBD"}, +1 active employee, +€${(f.salaryEur ?? 0).toLocaleString()} annual payroll cost`,
        fields: [
          { label: "Employee ID", value: hrisEmployeeId(contract) },
          { label: "Role", value: f.role ?? "—" },
          { label: "Manager", value: f.manager ?? "—" },
          { label: "Entity", value: f.lightEntity ?? "Light ApS (Denmark)" },
          { label: "Probation", value: f.probationMonths ? `${f.probationMonths} months` : "—" },
        ],
      },
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
      capTableDelta: {
        stakeholder: contract.counterparty,
        grantId: capTableGrantId(contract),
        fields: [
          { label: "Grant ID", value: capTableGrantId(contract) },
          { label: "Stakeholder", value: contract.counterparty },
          { label: "Percentage", value: `${f.warrantPct ?? 0}% (fully diluted)` },
          { label: "Vesting", value: `${f.vestingMonths ?? 48}m / ${f.cliffMonths ?? 12}m cliff` },
          { label: "Board resolution", value: f.boardResolutionRef ?? "Pending" },
          { label: "Entity", value: f.lightEntity ?? "Light ApS (Denmark)" },
        ],
      },
    };
  }
  return {
    headline: `${contract.name} filed`,
    rows: [{ label: "Type", value: t }, { label: "Counterparty", value: contract.counterparty }],
  };
}

// Stable but realistic-looking identifiers derived from the contract id so the
// same contract always renders the same entry number across reloads of the
// signed page.
function ledgerEntryNumber(c: Contract): string {
  const n = hashTo4Digits(c.id);
  return `JE-${n}`;
}
function hrisEmployeeId(c: Contract): string {
  const n = hashTo4Digits(c.id);
  return `EMP-${n}`;
}
function capTableGrantId(c: Contract): string {
  const n = hashTo4Digits(c.id);
  return `GR-${n}`;
}
function hashTo4Digits(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return String(4000 + (h % 5000)).padStart(4, "0");
}
function computeRenewalDate(startISO: string | undefined, termMonths: number): string {
  if (!startISO) return "TBD";
  const d = new Date(startISO);
  if (Number.isNaN(d.getTime())) return "TBD";
  d.setMonth(d.getMonth() + termMonths);
  return d.toISOString().slice(0, 10);
}

// ── Helpers for filters ──────────────────────────────────────────────────────

export function isBlocked(c: Contract): boolean {
  // Disjoint from "In review" KPI: contracts in the in_review or checks_running
  // stage are surfaced by that KPI, not this one. This KPI is for human-
  // blockage specifically: an approver hasn't responded, or DocuSign envelope
  // is stuck unsigned past a week.
  if (c.stage === "awaiting_approval" && (c.approvals ?? []).some((a) => a.status === "pending")) return true;
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

export function computeKpis(
  contracts: Contract[],
  forRole: string = "Head of Finance & Ops",
): {
  awaitingMe: number;
  blocked: number;
  inReview: number;
  inFlight: number;
  signedThisWeek: number;
  avgCycleDays: number;
} {
  const awaitingMe = contracts.filter((c) => isAwaitingMe(c, forRole)).length;
  const blocked = contracts.filter(isBlocked).length;
  const inReview = contracts.filter((c) => c.stage === "in_review" || c.stage === "checks_running").length;
  const inFlight = contracts.filter((c) => c.stage !== "filed" && c.stage !== "signed").length;
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
  return { awaitingMe, blocked, inReview, inFlight, signedThisWeek, avgCycleDays };
}

/**
 * Days since the contract last advanced. Used to surface a "stalling" badge
 * on individual rows. Not a KPI threshold any more (see ADR rationale: the
 * KPI label must match the filter tab semantics, so they both mean
 * "currently blocked," with row-level stale signal for urgency).
 */
export function stageAgeDays(c: Contract): number {
  return (Date.now() - new Date(c.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
}
