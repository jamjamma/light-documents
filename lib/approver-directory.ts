/**
 * Approver directory.
 *
 * Routing rules name a ROLE ("Legal", "CFO"). This module turns that role into
 * a specific INDIVIDUAL by applying a selection strategy over a group of members,
 * with optional specialty matching and PTO-aware delegation.
 *
 * In production the directory is backed by a settings UI:
 *   Settings → Approvers → per role, list members, set specialty tags, strategy.
 *   My delegates → users can mark themselves out-of-office and name a backup.
 *
 * The shape here mirrors what a settings table would store.
 */

import type {
  ApproverGroup,
  ApproverMember,
  ApproverRole,
  ClauseCheckResult,
  ContractFields,
  Delegation,
  DocumentType,
  SelectedApprover,
  SpecialtyTag,
  Template,
} from "./types";
import { jurisdictionForEntity } from "./policy-config";

// ── Directory data (settings-table stand-in) ──────────────────────────────────

const APPROVER_GROUPS: ApproverGroup[] = [
  {
    role: "Legal",
    strategy: "specialty_match",
    members: [
      {
        userId: "u_sara_friis",
        name: "Sara Friis",
        email: "sara@friislegal.dk",
        title: "Counsel (Denmark)",
        avatarColor: "bg-rose-50 text-rose-500",
        specialties: [
          "type:NDA",
          "type:MSA",
          "type:Order Form",
          "jurisdiction:DK",
          "entity:Light ApS (Denmark)",
        ],
        default: true,
      },
      {
        userId: "u_anna_lind",
        name: "Anna Lind",
        email: "anna@friislegal.dk",
        title: "Senior Counsel (UK)",
        avatarColor: "bg-rose-100 text-rose-700",
        specialties: [
          "type:MSA",
          "type:Order Form",
          "jurisdiction:UK",
          "entity:Light Ltd (United Kingdom)",
        ],
      },
      {
        userId: "u_ben_ng",
        name: "Ben Ng",
        email: "ben@friislegal.dk",
        title: "IP Counsel",
        avatarColor: "bg-rose-50 text-rose-700",
        specialties: ["type:Employment"],
      },
      {
        userId: "u_outside_counsel",
        name: "Nordic Counsel Partners (outside counsel)",
        email: "warrants@nordic-counsel.example",
        title: "Outside counsel (warrants)",
        avatarColor: "bg-ink-100 text-ink-700",
        specialties: ["type:Warrant"],
      },
    ],
  },
  {
    role: "Head of Finance & Ops",
    strategy: "specialty_match",
    members: [
      {
        userId: "u_martina_holst",
        name: "Martina Holst",
        email: "martina@light.inc",
        title: "Head of Finance & Ops",
        avatarColor: "bg-accent-100 text-accent-700",
        specialties: ["jurisdiction:DK", "entity:Light ApS (Denmark)"],
        default: true,
      },
      {
        userId: "u_sophie_marchetti",
        name: "Sophie Marchetti",
        email: "sophie@light.inc",
        title: "Finance Manager (UK)",
        avatarColor: "bg-accent-50 text-accent-800",
        specialties: ["jurisdiction:UK", "entity:Light Ltd (United Kingdom)"],
      },
    ],
  },
  {
    role: "CFO",
    strategy: "named_default",
    members: [
      {
        userId: "u_magnus_karlsson",
        name: "Magnus Karlsson",
        email: "magnus@light.inc",
        title: "Chief Financial Officer",
        avatarColor: "bg-blue-50 text-blue-700",
        specialties: [],
        default: true,
      },
    ],
  },
  {
    role: "People Ops",
    strategy: "specialty_match",
    members: [
      {
        userId: "u_pia_andersen",
        name: "Pia Andersen",
        email: "pia@light.inc",
        title: "Head of People (Denmark)",
        avatarColor: "bg-teal-50 text-teal-700",
        specialties: ["jurisdiction:DK", "entity:Light ApS (Denmark)"],
        default: true,
      },
      {
        userId: "u_holly_carter",
        name: "Holly Carter",
        email: "holly@light.inc",
        title: "People Partner (UK)",
        avatarColor: "bg-teal-100 text-teal-800",
        specialties: ["jurisdiction:UK", "entity:Light Ltd (United Kingdom)"],
      },
    ],
  },
  {
    role: "CEO",
    strategy: "named_default",
    members: [
      {
        userId: "u_jonathan_sanders",
        name: "Jonathan Sanders",
        email: "jonathan@light.inc",
        title: "Chief Executive Officer",
        avatarColor: "bg-ink-900 text-accent-300",
        specialties: [],
        default: true,
      },
    ],
  },
  {
    role: "Board",
    strategy: "all_required",
    members: [
      {
        userId: "u_astrid_sjoberg",
        name: "Astrid Sjöberg",
        email: "astrid@northzone.com",
        title: "Board Chair (Northzone)",
        avatarColor: "bg-purple-50 text-purple-700",
        specialties: [],
        default: true,
      },
      {
        userId: "u_christian_becker",
        name: "Christian Becker",
        email: "christian@indexventures.com",
        title: "Series A Lead Director (Index)",
        avatarColor: "bg-purple-100 text-purple-800",
        specialties: [],
      },
      {
        userId: "u_emma_holloway",
        name: "Emma Holloway",
        email: "emma@hollowayadvisors.com",
        title: "Independent Director",
        avatarColor: "bg-purple-50 text-purple-700",
        specialties: [],
      },
    ],
  },
];

/**
 * Active delegations. PTO entries route a person's incoming approvals to their
 * named backup for the window. In production these are written by users via a
 * "My delegates" page and optionally auto-created from Google Calendar OOO.
 *
 * Demo case: Anna Lind is on PTO 2026-05-10 to 2026-05-20 with Sara Friis covering.
 * This means UK MSA contracts that would normally route to Anna (jurisdiction:UK
 * specialty match) will fall through to Sara during this window, with the chain
 * UI surfacing "delegated by Anna Lind (PTO until 20 May 2026)".
 */
const DELEGATIONS: Delegation[] = [
  {
    fromUserId: "u_anna_lind",
    toUserId: "u_sara_friis",
    starts: "2026-05-10",
    ends: "2026-05-20",
    reason: "PTO",
  },
];

// ── Queries ───────────────────────────────────────────────────────────────────

export function getApproverGroup(role: ApproverRole): ApproverGroup | undefined {
  return APPROVER_GROUPS.find((g) => g.role === role);
}

export function listApproverGroups(): readonly ApproverGroup[] {
  return APPROVER_GROUPS;
}

export function listMembers(role: ApproverRole): readonly ApproverMember[] {
  return getApproverGroup(role)?.members ?? [];
}

export function findMember(userId: string): ApproverMember | undefined {
  for (const group of APPROVER_GROUPS) {
    const match = group.members.find((m) => m.userId === userId);
    if (match) return match;
  }
  return undefined;
}

function activeDelegationFor(userId: string, asOf: Date): Delegation | undefined {
  return DELEGATIONS.find((d) => {
    if (d.fromUserId !== userId) return false;
    const start = new Date(d.starts).getTime();
    const end = new Date(d.ends).getTime() + 24 * 60 * 60 * 1000; // inclusive of end day
    const t = asOf.getTime();
    return t >= start && t <= end;
  });
}

// ── Specialty matching ────────────────────────────────────────────────────────

export interface SelectionContext {
  template: Template;
  fields: ContractFields;
  results: ClauseCheckResult[];
  asOf?: Date;
}

function specialtyTagsFromContext(ctx: SelectionContext): readonly SpecialtyTag[] {
  const tags: SpecialtyTag[] = [`type:${ctx.template.type}`];
  const entity = ctx.fields.lightEntity ?? "Light ApS (Denmark)";
  tags.push(`entity:${entity}`);
  const jurisdiction = jurisdictionForEntity(entity);
  tags.push(`jurisdiction:${jurisdiction}`);
  return tags;
}

/**
 * Specialty tags are not equal in decision weight. Document type is the most
 * decision-relevant signal (an employment contract should route to IP counsel
 * regardless of jurisdiction; a warrant should route to outside counsel even
 * when in-house counsel happens to share the jurisdiction). The weights below
 * reflect that ordering and were chosen so a single type:X match beats two
 * weaker entity+jurisdiction matches.
 */
const SPECIALTY_WEIGHTS = {
  type: 10,
  entity: 2,
  jurisdiction: 1,
  value: 1,
} as const;

function tagClass(tag: SpecialtyTag): keyof typeof SPECIALTY_WEIGHTS {
  if (tag.startsWith("type:")) return "type";
  if (tag.startsWith("entity:")) return "entity";
  if (tag.startsWith("jurisdiction:")) return "jurisdiction";
  return "value";
}

function specialtyScore(member: ApproverMember, contextTags: readonly SpecialtyTag[]): number {
  let score = 0;
  for (const tag of member.specialties) {
    if (contextTags.includes(tag)) score += SPECIALTY_WEIGHTS[tagClass(tag)];
  }
  return score;
}

function findDefault(group: ApproverGroup): ApproverMember | undefined {
  return group.members.find((m) => m.default) ?? group.members[0];
}

// ── Main entry: select one member from a group ────────────────────────────────

/**
 * Pick the individual who should fulfil an approval for a given role.
 *
 * Behaviour:
 *   - all_required: returns the default committee chair, but UI should treat
 *     the role as collective (rendered with a sub-list of all members).
 *   - named_default: returns the marked-default member, ignoring specialties.
 *   - specialty_match: scores each member by specialty overlap with the
 *     contract context (type, jurisdiction, entity). Highest score wins; ties
 *     resolved deterministically by member index. Falls back to default if
 *     all scores are zero.
 *   - any_round_robin: not used in current data; selects first member.
 *
 * After the strategy picks a candidate, an active PTO delegation is applied:
 * if the candidate is delegated-out at `asOf`, the picked member becomes their
 * delegate, and the SelectedApprover carries `delegateOfName` so the UI can
 * render "Sara Friis (delegating for Anna Lind, PTO until 20 May 2026)".
 */
export function selectApprover(role: ApproverRole, ctx: SelectionContext): SelectedApprover | undefined {
  const group = getApproverGroup(role);
  if (!group) return undefined;
  if (group.members.length === 0) return undefined;

  const asOf = ctx.asOf ?? new Date();
  const contextTags = specialtyTagsFromContext(ctx);

  let picked: ApproverMember | undefined;
  let pickReason = "";

  if (group.strategy === "named_default") {
    picked = findDefault(group);
    pickReason = picked ? `Default ${role} approver` : "";
  } else if (group.strategy === "all_required") {
    picked = findDefault(group);
    pickReason = picked
      ? `Committee chair (entire ${role} committee must approve)`
      : "";
  } else if (group.strategy === "any_round_robin") {
    picked = group.members[0];
    pickReason = `Round-robin selection from ${role} group`;
  } else if (group.strategy === "specialty_match") {
    const scored = group.members
      .map((m) => ({ member: m, score: specialtyScore(m, contextTags) }))
      .sort((a, b) => b.score - a.score);
    const top = scored[0];
    if (top && top.score > 0) {
      picked = top.member;
      const matched = picked.specialties.filter((tag) => contextTags.includes(tag));
      pickReason = `Specialty match (${matched.join(", ")})`;
    } else {
      picked = findDefault(group);
      pickReason = picked ? `No specialty match. Default ${role} approver` : "";
    }
  }

  if (!picked) return undefined;

  // Apply PTO delegation if active for the picked member.
  const delegation = activeDelegationFor(picked.userId, asOf);
  if (delegation) {
    const delegate = findMember(delegation.toUserId);
    if (delegate) {
      return {
        userId: delegate.userId,
        name: delegate.name,
        email: delegate.email,
        title: delegate.title,
        avatarColor: delegate.avatarColor,
        selectionReason: `${pickReason} for ${picked.name}; ${delegation.reason ?? "delegated"} until ${formatShortDate(delegation.ends)}`,
        delegateOfUserId: picked.userId,
        delegateOfName: picked.name,
      };
    }
  }

  return {
    userId: picked.userId,
    name: picked.name,
    email: picked.email,
    title: picked.title,
    avatarColor: picked.avatarColor,
    selectionReason: pickReason,
  };
}

/**
 * For committees (strategy = "all_required"): return EVERY member with PTO
 * delegations applied per member. Callers emit one Approval per returned entry,
 * and `allApproved` then requires each to be approved independently.
 *
 * Members without an active delegation return as themselves. Members on PTO
 * return as their delegate, with `delegateOfName` so the UI shows
 * "Sara Friis (delegating for Astrid Sjöberg)".
 *
 * The order matches `group.members` so the chair (default member) is first.
 */
export function selectAllMembers(role: ApproverRole, ctx: SelectionContext): SelectedApprover[] {
  const group = getApproverGroup(role);
  if (!group || group.members.length === 0) return [];
  const asOf = ctx.asOf ?? new Date();
  const n = group.members.length;

  return group.members.map((member, idx) => {
    const baseReason = `Committee member ${idx + 1} of ${n} (${role}); every member must approve`;
    const delegation = activeDelegationFor(member.userId, asOf);
    if (delegation) {
      const delegate = findMember(delegation.toUserId);
      if (delegate) {
        return {
          userId: delegate.userId,
          name: delegate.name,
          email: delegate.email,
          title: delegate.title,
          avatarColor: delegate.avatarColor,
          selectionReason: `${baseReason}; ${delegation.reason ?? "delegated"} from ${member.name} until ${formatShortDate(delegation.ends)}`,
          delegateOfUserId: member.userId,
          delegateOfName: member.name,
        };
      }
    }
    return {
      userId: member.userId,
      name: member.name,
      email: member.email,
      title: member.title,
      avatarColor: member.avatarColor,
      selectionReason: baseReason,
    };
  });
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── For Settings UI (future) and debugging ────────────────────────────────────

export function listActiveDelegations(asOf?: Date): Delegation[] {
  const t = (asOf ?? new Date()).getTime();
  return DELEGATIONS.filter((d) => {
    const start = new Date(d.starts).getTime();
    const end = new Date(d.ends).getTime() + 24 * 60 * 60 * 1000;
    return t >= start && t <= end;
  });
}
