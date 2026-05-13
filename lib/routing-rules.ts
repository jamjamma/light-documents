import type {
  Template,
  ContractFields,
  ClauseCheckResult,
  RoutingRule,
  Approval,
  ApproverRole,
  NotificationChannel,
} from "./types";
import { CHANNEL_RESTRICTIVENESS } from "./types";
import { allStandard, countDeviations } from "./clause-checker";
import { isAcceptedLaw, isSalaryAboveBand, jurisdictionForEntity } from "./policy-config";
import { selectApprover, selectAllMembers, getApproverGroup } from "./approver-directory";

/**
 * Centralised routing rules engine.
 *
 * Each rule is a typed object with `appliesTo` (which templates it pertains to)
 * and `trigger` (whether it fires given the inputs). `computeRouting` evaluates
 * all rules, deduplicates by approver role, picks an individual from the role's
 * group via the approver directory, resolves channel collisions to the most
 * restrictive channel, and returns the required approval chain.
 *
 * Why a rules engine and not if-else:
 * 1. Each rule's "why" is attached, so the UI can surface "CFO required because:
 *    ARR > €100k threshold" rather than a vague "needs approval".
 * 2. Adding a rule is a one-line append, not surgery.
 * 3. The Head of Finance & Ops role owns this file in production. A rules engine
 *    makes that owner-editable rather than developer-only.
 *
 * Channel collision (added 2026-05-12):
 *   When two rules for the same role declare different channels (one Slack DM,
 *   another Email magic link) the most-restrictive channel wins so the approver
 *   is never under-notified. Previously the first rule's channel silently won,
 *   which is a latent correctness bug.
 *
 * Approver selection (added 2026-05-12):
 *   Rules name a role. The role is resolved to a specific individual via the
 *   approver-directory module, which applies specialty matching (jurisdiction,
 *   doc type, entity) and PTO delegation. Each Approval carries
 *   assignedName + selectionReason so the chain UI explains the pick.
 */
export const ROUTING_RULES: RoutingRule[] = [
  // ── MSA ─────────────────────────────────────────────────────────────────────
  {
    id: "msa_value_gte_50k",
    reason: "ARR ≥ €50,000: Head of Finance & Ops approval required",
    appliesTo: (t) => t.type === "MSA",
    trigger: (f) => (f.contractValueEur ?? 0) >= 50_000,
    approver: "Head of Finance & Ops",
    channel: "Slack DM",
    autoApproveIfStandard: true,
  },
  {
    id: "msa_value_gte_100k",
    reason: "ARR ≥ €100,000: CFO approval required",
    appliesTo: (t) => t.type === "MSA",
    trigger: (f) => (f.contractValueEur ?? 0) >= 100_000,
    approver: "CFO",
    channel: "Slack DM",
    autoApproveIfStandard: false,
  },
  {
    id: "msa_clause_deviation",
    reason: "One or more clauses deviate from master template: Legal review required",
    appliesTo: (t) => t.type === "MSA",
    trigger: (_f, results) => countDeviations(results) > 0,
    approver: "Legal",
    channel: "Slack DM",
    autoApproveIfStandard: false,
  },

  // ── NDA ─────────────────────────────────────────────────────────────────────
  {
    id: "nda_non_eu_jurisdiction",
    reason: "Non-EU or non-UK governing law: Legal review required",
    appliesTo: (t) => t.type === "NDA",
    trigger: (f) => !isAcceptedLaw(f.governingLaw),
    approver: "Legal",
    channel: "Slack DM",
    autoApproveIfStandard: false,
  },

  // ── Order Form ──────────────────────────────────────────────────────────────
  {
    id: "orderform_value_gte_25k",
    reason: "Order Form total ≥ €25,000: Head of Finance & Ops awareness",
    appliesTo: (t) => t.type === "Order Form",
    trigger: (f) => (f.orderTotalEur ?? 0) >= 25_000,
    approver: "Head of Finance & Ops",
    channel: "Slack DM",
    autoApproveIfStandard: true,
  },
  {
    id: "orderform_value_gte_100k",
    reason: "Order Form total ≥ €100,000: CFO approval required",
    appliesTo: (t) => t.type === "Order Form",
    trigger: (f) => (f.orderTotalEur ?? 0) >= 100_000,
    approver: "CFO",
    channel: "Slack DM",
    autoApproveIfStandard: false,
  },
  {
    id: "orderform_missing_msa_ref",
    reason: "Order Form must reference an executed MSA: Legal block",
    appliesTo: (t) => t.type === "Order Form",
    trigger: (f) => !f.referenceMsaId || f.referenceMsaId.length === 0,
    approver: "Legal",
    channel: "Slack DM",
    autoApproveIfStandard: false,
  },

  // ── Employment ──────────────────────────────────────────────────────────────
  {
    id: "employment_people_ops_always",
    reason: "Employment contract: People Ops approval required",
    appliesTo: (t) => t.type === "Employment",
    trigger: () => true,
    approver: "People Ops",
    channel: "Slack DM",
    autoApproveIfStandard: true,
  },
  {
    id: "employment_above_band",
    reason: "Salary above standard band for role: CFO approval required",
    appliesTo: (t) => t.type === "Employment",
    trigger: (f) => isSalaryAboveBand(f.role, f.salaryEur, jurisdictionForEntity(f.lightEntity)),
    approver: "CFO",
    channel: "Slack DM",
    autoApproveIfStandard: false,
  },
  {
    id: "employment_equity_grant",
    reason: "Equity grant included: CEO sign-off required",
    appliesTo: (t) => t.type === "Employment",
    trigger: (f) => (f.equityBps ?? 0) > 0,
    approver: "CEO",
    channel: "Slack DM",
    autoApproveIfStandard: false,
  },

  // ── Warrant ─────────────────────────────────────────────────────────────────
  {
    id: "warrant_legal_always",
    reason: "Warrant: Legal review required",
    appliesTo: (t) => t.type === "Warrant",
    trigger: () => true,
    approver: "Legal",
    channel: "Email magic link",
    autoApproveIfStandard: false,
  },
  {
    id: "warrant_cfo_always",
    reason: "Warrant: CFO approval required",
    appliesTo: (t) => t.type === "Warrant",
    trigger: () => true,
    approver: "CFO",
    channel: "Slack DM",
    autoApproveIfStandard: false,
  },
  {
    id: "warrant_board_resolution",
    reason: "Warrant: Board resolution required (fresh resolution per grant)",
    // Fires for the standard warrant template; the advisor template uses the
    // standing pool resolution (no fresh Board vote unless the grant exceeds
    // the pool limit, which is handled by the rule below).
    appliesTo: (t) => t.id === "warrant_v1_5",
    trigger: () => true,
    approver: "Board",
    channel: "Email magic link",
    autoApproveIfStandard: false,
  },
  {
    id: "advisor_warrant_above_pool",
    reason: "Advisor warrant > 0.5%: exceeds standing pool authority; fresh Board approval required",
    appliesTo: (t) => t.id === "warrant_advisor_v1_0",
    trigger: (f) => (f.warrantPct ?? 0) > 0.5,
    approver: "Board",
    channel: "Email magic link",
    autoApproveIfStandard: false,
  },

];

// Re-export getSalaryBand for IntakeForm back-compat. Eventually IntakeForm should
// import directly from policy-config; this keeps the diff narrow.
export { getSalaryBand } from "./policy-config";

/**
 * Pick the more-restrictive channel of two NotificationChannel values.
 * Most-restrictive = the channel that demands the most explicit action from
 * the recipient (Email magic link > Slack DM > Slack channel > In-app only).
 */
function pickMoreRestrictiveChannel(a: NotificationChannel, b: NotificationChannel): NotificationChannel {
  return CHANNEL_RESTRICTIVENESS[a] >= CHANNEL_RESTRICTIVENESS[b] ? a : b;
}

interface MergedRule {
  reasons: string[];
  channel: NotificationChannel;
  autoApproveIfStandard: boolean;
  /** Channels declared by rules that triggered for this role; lets the UI surface collisions. */
  channelsRequested: Set<NotificationChannel>;
}

/**
 * Compute the required approval chain for a contract.
 *
 * Steps:
 *   1. Filter ROUTING_RULES by template and trigger.
 *   2. Merge by role: concatenate reasons, AND the auto-approve flag, pick the
 *      most-restrictive channel.
 *   3. For each role, call selectApprover to pick an individual.
 *   4. Auto-approve when all triggered rules allow it AND clauses are standard.
 */
export function computeRouting(
  template: Template,
  fields: ContractFields,
  results: ClauseCheckResult[],
): Approval[] {
  const triggered = ROUTING_RULES
    .filter((r) => r.appliesTo(template))
    .filter((r) => r.trigger(fields, results));

  const byRole = new Map<ApproverRole, MergedRule>();

  for (const rule of triggered) {
    const existing = byRole.get(rule.approver);
    if (existing) {
      existing.reasons.push(rule.reason);
      existing.autoApproveIfStandard = existing.autoApproveIfStandard && (rule.autoApproveIfStandard ?? false);
      existing.channel = pickMoreRestrictiveChannel(existing.channel, rule.channel);
      existing.channelsRequested.add(rule.channel);
    } else {
      byRole.set(rule.approver, {
        reasons: [rule.reason],
        channel: rule.channel,
        autoApproveIfStandard: rule.autoApproveIfStandard ?? false,
        channelsRequested: new Set([rule.channel]),
      });
    }
  }

  const standard = allStandard(results);

  return Array.from(byRole.entries()).flatMap(([role, info]) => {
    const channelCollision = info.channelsRequested.size > 1;
    const reasonText = info.reasons.join("; ");
    const fullReason = channelCollision
      ? `${reasonText} (multiple channels requested; using most-restrictive: ${info.channel})`
      : reasonText;
    const auto = info.autoApproveIfStandard && standard;
    const decidedAt = auto ? new Date().toISOString() : undefined;
    const decidedBy = auto ? "system (auto by rule)" : undefined;

    const group = getApproverGroup(role);
    const isCommittee = group?.strategy === "all_required";

    // Committee (Board): emit one Approval per member. allApproved() then
    // requires every member to approve independently. PTO delegations are
    // applied per-member by selectAllMembers.
    if (isCommittee) {
      const members = selectAllMembers(role, { template, fields, results });
      if (members.length === 0) {
        return [{
          role,
          reason: fullReason,
          status: auto ? "auto_approved" : "pending" as const,
          channel: info.channel,
          decidedAt,
          decidedBy,
        }];
      }
      return members.map((m) => ({
        role,
        reason: fullReason,
        status: auto ? "auto_approved" : "pending" as const,
        channel: info.channel,
        decidedAt,
        decidedBy,
        assignedUserId: m.userId,
        assignedName: m.name,
        assignedTitle: m.title,
        assignedEmail: m.email,
        assignedAvatarColor: m.avatarColor,
        selectionReason: m.selectionReason,
        delegateOfUserId: m.delegateOfUserId,
        delegateOfName: m.delegateOfName,
      }));
    }

    // Single-approver groups: one Approval entry as before.
    const selected = selectApprover(role, { template, fields, results });
    return [{
      role,
      reason: fullReason,
      status: auto ? "auto_approved" : "pending" as const,
      channel: info.channel,
      decidedAt,
      decidedBy,
      assignedUserId: selected?.userId,
      assignedName: selected?.name,
      assignedTitle: selected?.title,
      assignedEmail: selected?.email,
      assignedAvatarColor: selected?.avatarColor,
      selectionReason: selected?.selectionReason,
      delegateOfUserId: selected?.delegateOfUserId,
      delegateOfName: selected?.delegateOfName,
    }];
  });
}

export function allApproved(approvals: Approval[] | undefined): boolean {
  if (!approvals || approvals.length === 0) return true;
  return approvals.every((a) => a.status === "approved" || a.status === "auto_approved");
}
