export type TemplateId =
  | "nda_v3_1"
  | "msa_v4_2"
  | "msa_pilot_v1_0"
  | "order_form_v2_0"
  | "employment_dk_v2_0"
  | "employment_uk_v1_0"
  | "warrant_v1_5"
  | "warrant_advisor_v1_0";

export type DocumentType = "NDA" | "MSA" | "Order Form" | "Employment" | "Warrant";

/**
 * Light operates across three jurisdictions, each backed by a Light entity.
 * Used for salary bands, signer routing, and template defaults.
 */
export type Jurisdiction = "DK" | "UK" | "US";

export type Risk = "low" | "medium" | "high";

export type Stage =
  | "draft"
  | "needs_info"
  | "checks_running"
  | "in_review"
  | "awaiting_approval"
  | "ready_to_send"
  | "sent"
  | "signed"
  | "filed";

export type ApproverRole =
  | "Head of Finance & Ops"
  | "Counsel"
  | "CFO"
  | "People Ops"
  | "CEO"
  | "Board";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "auto_approved";

export type NotificationChannel = "Slack DM" | "Slack channel" | "Email magic link" | "In-app only";

/**
 * Notification channel ordering, most-restrictive first.
 * Used by computeRouting to resolve channel collisions when two rules for the
 * same role declare different channels. The most-restrictive channel wins so
 * the approver is never under-notified.
 */
export const CHANNEL_RESTRICTIVENESS: Record<NotificationChannel, number> = {
  "Email magic link": 4,
  "Slack DM": 3,
  "Slack channel": 2,
  "In-app only": 1,
};

export interface Approval {
  role: ApproverRole;
  reason: string;
  status: ApprovalStatus;
  channel: NotificationChannel;
  /**
   * Individual selected from the role's group plus the reason. Optional because
   * legacy / unseeded data may pre-date the directory. Renderers fall back to
   * role-only display when missing.
   */
  assignedUserId?: string;
  assignedName?: string;
  assignedTitle?: string;
  assignedEmail?: string;
  assignedAvatarColor?: string;
  selectionReason?: string;
  /**
   * When set, this approver is acting as delegate for the named user who is
   * out of office. decidedBy then reads "Sara Friis (delegating for Anna Lind)".
   */
  delegateOfUserId?: string;
  delegateOfName?: string;
  /** Legacy free-text delegate marker. Superseded by delegateOfName but kept for back-compat. */
  delegate?: string;
  decidedAt?: string;
  decidedBy?: string;
}

// ── Approver directory ─────────────────────────────────────────────────────────

/**
 * Specialty tags attached to approver members. The selection engine matches these
 * against contract context (template type, jurisdiction, Light entity, value).
 * Template-literal types keep the tags type-safe without an enum explosion.
 */
export type SpecialtyTag =
  | `type:${DocumentType}`
  | `jurisdiction:${string}`
  | `entity:${string}`
  | `value:>=${number}`;

export type SelectionStrategy =
  | "specialty_match"
  | "any_round_robin"
  | "all_required"
  | "named_default";

export interface ApproverMember {
  userId: string;
  name: string;
  email: string;
  title: string;
  /** Tailwind classes for the avatar pill (bg + text). */
  avatarColor: string;
  specialties: SpecialtyTag[];
  /** Marked-default member is the fallback when no specialty matches. Exactly one per group. */
  default?: boolean;
}

export interface ApproverGroup {
  role: ApproverRole;
  strategy: SelectionStrategy;
  members: ApproverMember[];
}

export interface Delegation {
  fromUserId: string;
  toUserId: string;
  starts: string;
  ends: string;
  reason?: string;
}

/**
 * Result of picking an individual from a group. Carries the picked member plus
 * enough explanation that the UI can render "why Sara, not Anna?".
 */
export interface SelectedApprover {
  userId: string;
  name: string;
  email: string;
  title: string;
  avatarColor: string;
  selectionReason: string;
  delegateOfUserId?: string;
  delegateOfName?: string;
}

export type SourceRecordType = "deal" | "candidate" | "stakeholder" | "vendor";

export type SourceSystem =
  | "Salesforce"
  | "HubSpot"
  | "Attio"
  | "Pipedrive"
  | "Personio"
  | "Ashby"
  | "Workday"
  | "Manual entry";

export interface SourceRecord {
  id: string;
  type: SourceRecordType;
  system: SourceSystem;
  externalRef?: string;
  display: string;
  subtitle: string;
  syncedAt: string;
  data: Record<string, string | number | boolean>;
}

export interface ContractFields {
  counterpartyLegalName?: string;
  lightEntity?: string;
  contractValueEur?: number;
  paymentTermsDays?: number;
  liabilityCapEur?: number;
  liabilityCapUnlimited?: boolean;
  indemnity?: "mutual" | "customer_only" | "vendor_only";
  governingLaw?: string;
  effectiveDate?: string;
  termMonths?: number;
  autoRenew?: boolean;
  dpaRequired?: boolean;
  counterpartySignerName?: string;
  counterpartySignerEmail?: string;
  counterpartySignerTitle?: string;
  lightSignerName?: string;
  lightSignerTitle?: string;
  candidateName?: string;
  role?: string;
  salaryEur?: number;
  variablePct?: number;
  startDate?: string;
  manager?: string;
  probationMonths?: number;
  workLocation?: string;
  equityBps?: number;
  stakeholderName?: string;
  warrantPct?: number;
  vestingMonths?: number;
  cliffMonths?: number;
  boardResolutionRef?: string;
  vendorName?: string;
  vendorService?: string;
  monthlySpendEur?: number;
  jurisdiction?: string;
  /** Order Form fields */
  referenceMsaId?: string;
  orderTotalEur?: number;
  billingFrequency?: "monthly" | "quarterly" | "annual";
  seatCount?: number;
  /** One-way NDA */
  disclosingParty?: string;
  receivingParty?: string;
}

export interface ClauseRule {
  key: string;
  label: string;
  expected: string;
  predicate: (fields: ContractFields) => boolean;
  observed: (fields: ContractFields) => string;
  severity: "info" | "warn" | "block";
  reason: string;
}

export interface DocuSignFeatures {
  qesRequired?: boolean;
  smsVerification?: boolean;
  witnessRequired?: boolean;
  powerFormCapable?: boolean;
  bulkSendCapable?: boolean;
  expiryDays?: number;
  reminderDays?: number[];
  signingOrder?: "sequential" | "parallel";
}

export interface ConditionalSection {
  id: string;
  label: string;
  description: string;
  appliesWhen: (fields: ContractFields) => boolean;
}

export interface TemplateVersion {
  version: string;
  releasedAt: string;
  status: "current" | "deprecated" | "archived";
  deprecatedAt?: string;
  author: string;
  changeNote: string;
}

export interface RogueTemplate {
  fileName: string;
  driveFileId: string;
  detectedAt: string;
  matchesTemplate: TemplateId;
  similarity: number;
  lastUsedBy?: string;
  lastUsedAt?: string;
  diffSummary: string;
  recommendedAction: string;
}

export interface Template {
  id: TemplateId;
  /**
   * Short name shown in the template gallery and contract subtitles
   * (e.g. "MSA", "MSA: Pilot", "Mutual NDA"). Kept compact so cards don't
   * truncate. For the formal docx heading + signature legal body, use
   * `formalName` when set.
   */
  name: string;
  /**
   * Optional formal legal name used for the docx preview heading and the
   * "By signing below, each party agrees to be bound by..." line. Falls
   * back to `name` when absent. Lets the gallery show "MSA" while the
   * generated document still reads "MASTER SERVICES AGREEMENT".
   */
  formalName?: string;
  version: string;
  type: DocumentType;
  risk: Risk;
  ownerTeam: string;
  jurisdictions: string[];
  description: string;
  clauseRules: ClauseRule[];
  docusignFeatures: DocuSignFeatures;
  conditionalSections: ConditionalSection[];
  anchorTags: string[];
  versionHistory?: TemplateVersion[];
}

export interface ClauseCheckResult {
  key: string;
  label: string;
  expected: string;
  observed: string;
  status: "standard" | "deviation";
  severity: "info" | "warn" | "block";
  reason?: string;
}

export interface RoutingRule {
  id: string;
  reason: string;
  appliesTo: (template: Template) => boolean;
  trigger: (fields: ContractFields, results: ClauseCheckResult[]) => boolean;
  approver: ApproverRole;
  channel: NotificationChannel;
  autoApproveIfStandard?: boolean;
}

export interface AuditEvent {
  at: string;
  actor: string;
  event: string;
  meta?: string;
}

/**
 * Structured writeback emitted on `envelope-completed`. Each system-of-record
 * target (Light ledger / HRIS / cap table) renders a slightly different shape.
 * The summary `headline` + `rows` are always present so the UI can fall back to
 * a flat summary; richer surfaces (the journal entry, HRIS payload, cap-table
 * row) are optional and gate on the document type.
 */
export interface LedgerImpact {
  headline: string;
  rows: { label: string; value: string; note?: string }[];
  /** GL journal entry for revenue-bearing contracts (MSA, Order Form). */
  journalEntry?: {
    entryNumber: string;
    postedAt: string;
    debit: { account: string; amount: string };
    credit: { account: string; amount: string };
    dimensions: { label: string; value: string }[];
  };
  /** HRIS writeback summary for Employment contracts. */
  hrisRecord?: {
    employeeId: string;
    payrollUpdate: string;
    fields: { label: string; value: string }[];
  };
  /** Cap-table delta for Warrant contracts. */
  capTableDelta?: {
    stakeholder: string;
    grantId: string;
    fields: { label: string; value: string }[];
  };
}

export interface Contract {
  id: string;
  name: string;
  type: DocumentType;
  templateId: TemplateId;
  /**
   * Template version pinned at create time. If the master template is later
   * updated to a new version, in-flight contracts continue to display and
   * check against the version they were created with. The detail page surfaces
   * a banner when the live template version differs from the pinned one.
   */
  templateVersion?: string;
  sourceRecordId: string;
  counterparty: string;
  owner: string;
  ownerTeam: string;
  valueEur?: number;
  risk: Risk;
  stage: Stage;
  createdAt: string;
  updatedAt: string;
  fields: ContractFields;
  clauseResults?: ClauseCheckResult[];
  approvals?: Approval[];
  audit: AuditEvent[];
  envelopeId?: string;
  signedAt?: string;
  ledger?: LedgerImpact;
}

export interface DashboardKpis {
  awaitingMe: number;
  blocked: number;
  inReview: number;
  inFlight: number;
  signedThisWeek: number;
  avgCycleDays: number;
}
