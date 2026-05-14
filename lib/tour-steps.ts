/**
 * Guided product tour steps.
 *
 * Each step is bound to a specific pathname + DOM selector. The TourController
 * mounts in the root layout, watches pathname + localStorage, and drives the
 * driver.js popover for the current step on each page.
 *
 * The hero MSA contract is `c_bolt_msa` (high-risk, in-review). The signed
 * walkthrough jumps to `c_acme_msa/signed` because Bolt MSA isn't signed yet
 * and we don't want the tour to force the user through the modal/Send flow.
 *
 * Anchors are CSS classes prefixed with `tour-anchor-` placed on the relevant
 * wrapper element so the tour doesn't break if the components are restyled.
 *
 * Descriptions support HTML. Driver.js renders the description string via
 * innerHTML so we can use <strong>, <em>, <code>, <ul>, <li> for richer
 * formatting. Keep copy short: ~2-4 short paragraphs max per step.
 */

import type { Side } from "driver.js";

export const HERO_CONTRACT_ID = "c_bolt_msa";
export const SIGNED_DEMO_ID = "c_acme_msa";

export interface TourStep {
  /** Stable id, used for de-dupe in the controller render guard. */
  id: string;
  /** Pathname the step is bound to. `*` matches any. */
  path: string;
  /** CSS selector for the anchor element. If absent, popover floats centred. */
  selector?: string;
  /** Popover title. */
  title: string;
  /** Body copy (HTML allowed; rendered via driver.js innerHTML). */
  description: string;
  /** Where to position the popover relative to the anchor. */
  side?: Side;
  /**
   * What "Next" should do:
   *  - `advance` (default): just advance to the next step. If the next step
   *    is on a different path, the controller goes dormant until the user
   *    naturally navigates.
   *  - `navigate`: route to `goto` THEN advance. The next step is expected
   *    to live at `goto` and will render once that page hydrates.
   */
  next?: "advance" | "navigate";
  /** For `next: "navigate"`, the path to push. */
  goto?: string;
  /** Optional copy override for the next button. */
  nextLabel?: string;
  /** Suppress the Back button (e.g. on the welcome step). */
  hideBack?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  // ── Act 1: Operator surface (dashboard) ────────────────────────────────
  {
    id: "welcome",
    path: "/",
    title: "Welcome to Light Documents",
    description: `
      <p>A ~2-minute tour through one contract end-to-end, from intake to signed structured writeback.</p>
      <p>Skip anytime with <kbd>Esc</kbd> or the <strong>×</strong> button. You can restart from the sidebar.</p>
    `,
    next: "advance",
    nextLabel: "Start",
    hideBack: true,
  },
  {
    id: "reframe",
    path: "/",
    title: "The partner-framed answer",
    description: `
      <p>The stated pain (manual Word edits, hand-placed DocuSign fields) is real, and this build kills both directly.</p>
      <p>The bigger prize uniquely available to Light: every signed contract becomes <strong>structured data</strong> that flows into the relevant system of record. The PDF is the audit artifact; the data is the product.</p>
    `,
    next: "advance",
  },
  {
    id: "kpis",
    path: "/",
    selector: ".tour-anchor-kpis",
    side: "bottom",
    title: "Operator-actionable KPIs",
    description: `
      <p>Three tiles cover what an ops lead actually acts on:</p>
      <ul>
        <li><strong>Awaiting me</strong>: pending the operator's approval</li>
        <li><strong>Blocked</strong>: awaiting approval or in review</li>
        <li><strong>In review</strong>: clause check running or legal review</li>
      </ul>
      <p>Each tile filters the table below. Cycle health is demoted to a secondary line because it's a leadership metric, not an action one.</p>
    `,
    next: "advance",
  },
  {
    id: "table-filters",
    path: "/",
    selector: ".tour-anchor-table-filters",
    side: "bottom",
    title: "Stage tabs + type chips",
    description: `
      <p>Two filters compose: <strong>stage tabs</strong> (All in-flight / Awaiting me / Blocked / In review) and <strong>type chips</strong> (MSA, NDA, Employment, Warrant, Order Form).</p>
      <p>The same workflow engine handles all 8 templates: same intake, same clause check, same routing, same writeback shape (per document type).</p>
    `,
    next: "advance",
  },
  {
    id: "open-bolt",
    path: "/",
    selector: ".tour-anchor-callout",
    side: "bottom",
    title: "Open the hero contract",
    description: `
      <p>Bolt MSA is a <strong>high-risk, in-review</strong> €180k UK contract with 3 clause deviations from the master template.</p>
      <p>Click <strong>Open Bolt MSA</strong> below to walk the workflow.</p>
    `,
    next: "navigate",
    goto: `/contracts/${HERO_CONTRACT_ID}`,
    nextLabel: "Open Bolt MSA →",
  },

  // ── Act 2: The workflow (contract detail) ──────────────────────────────
  {
    id: "clause-diff",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-clause-diff",
    side: "top",
    title: "Clause checker (3 deviations flagged)",
    description: `
      <p>The clause engine compared the negotiated draft to the pinned master template and flagged:</p>
      <ul>
        <li><strong>Net 60</strong> vs Net 30 standard</li>
        <li><strong>Unlimited liability</strong> vs €500k cap</li>
        <li><strong>Customer-only indemnity</strong> vs mutual</li>
      </ul>
      <p>In production, Claude proposes the deviations with rationale. The rules engine decides who approves. <em>Separation of duties keeps the system auditable.</em></p>
    `,
    next: "advance",
  },
  {
    id: "routing",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-routing",
    side: "top",
    title: "Routing rules engine",
    description: `
      <p>13 typed routing rules fire based on the contract fields + clause results. For Bolt MSA, three approvers were summoned:</p>
      <ul>
        <li><strong>Legal</strong>: because clause deviations were flagged</li>
        <li><strong>Head of F&amp;O</strong>: because ARR &gt; €50k</li>
        <li><strong>CFO</strong>: because ARR &gt; €100k</li>
      </ul>
      <p>Each row carries its <em>"why"</em> for the audit log. Head of F&amp;O owns this engine in production.</p>
    `,
    next: "advance",
  },
  {
    id: "approval-chain",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-approval-chain",
    side: "top",
    title: "Approval chain &middot; with operator actions",
    description: `
      <p>Approvers are pinged via <strong>Slack DM</strong> (or email magic link for board / external counsel). Each row has actions on the &middot;&middot;&middot; menu: <strong>Reassign</strong>, <strong>Pass on</strong>, <strong>Re-ping</strong>, <strong>Reject</strong>.</p>
      <p>Try clicking <em>Simulate Sara approves</em> on the Legal row. The pill flips green and an <strong>Undo</strong> button appears next to it, because you (Martina) approved on Sara's behalf.</p>
      <p><em>Once DocuSign has the envelope, Undo is refused. That's the line.</em></p>
    `,
    next: "advance",
  },
  {
    id: "preview-envelope",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-preview-envelope",
    side: "top",
    title: "Anchor-tag envelope preview",
    description: `
      <p>Once all chips are green, <strong>Preview envelope</strong> opens a populated MSA with anchor-tag callouts. Counsel embedded the anchor strings in the Word template once as white-on-white text; DocuSign API places every signature field automatically.</p>
      <p>The configuration block (expiry, reminders, QES, witness, PowerForm) is collapsed by default behind an audit-view disclosure.</p>
      <p>For this tour I'll skip ahead to a contract that's already signed, so you can see the structured writeback.</p>
    `,
    next: "navigate",
    goto: `/contracts/${SIGNED_DEMO_ID}/signed`,
    nextLabel: "See a signed contract →",
  },

  // ── Act 3: Outputs + extensibility ─────────────────────────────────────
  {
    id: "structured-writeback",
    path: `/contracts/${SIGNED_DEMO_ID}/signed`,
    selector: ".tour-anchor-ledger",
    side: "left",
    title: "Structured writeback &middot; the strategic extension",
    description: `
      <p>Every signed MSA emits a <strong>journal entry shape</strong>: DR Trade Receivables / CR Deferred Revenue, with dimension chips (customer, source record, entity, renewal).</p>
      <p>For Employment contracts the shape becomes an HRIS record. For Warrants, a cap-table grant. For NDAs (no commercial impact), the audit trail itself is the system of record.</p>
      <p><em>The prototype renders the shape. In production it posts to whichever endpoint Light exposes. Both sides of the integration are stubbed in this build: this is the structural argument, not a capability claim.</em></p>
    `,
    next: "navigate",
    goto: "/archive",
    nextLabel: "Past contracts →",
  },
  {
    id: "signed-archive",
    path: "/archive",
    title: "Signed contracts archive",
    description: `
      <p>Past signed contracts live here. KPIs are <strong>counts</strong> (total, customer, people, equity): not ARR / headcount / equity totals. Those leadership metrics live on Light's real dashboards, not on a contract-retrieval surface.</p>
      <p>Each row links to its full signed record (audit trail + writeback). The list also surfaces who signed, when, and against which template version.</p>
    `,
    next: "navigate",
    goto: "/templates",
    nextLabel: "Templates →",
  },
  {
    id: "templates",
    path: "/templates",
    title: "Templates &middot; Counsel keeps Word",
    description: `
      <p>Master templates live as Word docs in Drive, owned by Legal. Counsel never logs into Light Documents: they edit master templates where they already edit, with Track Changes and comments. Our platform watches the folder via Drive Watch API and syncs.</p>
      <p>Scroll down: the <strong>Rogue templates</strong> panel is a Phase-2 governance demo. A daily Drive scan flags docs that look like master templates but sit outside <code>/Master Templates/</code>. Each rogue file gets Archive + Notify Owner actions with a smart routing rationale (still-employed lastUser → DM; ex-employee → channel fallback).</p>
    `,
    next: "advance",
    nextLabel: "Wrap up",
  },

  // ── Wrap up ────────────────────────────────────────────────────────────
  {
    id: "done",
    path: "*",
    title: "That's the tour",
    description: `
      <p>You've seen:</p>
      <ul>
        <li>Operator KPIs &middot; stage tabs &middot; type chips</li>
        <li>Clause checker &middot; routing rules &middot; approval chain &middot; Undo</li>
        <li>Anchor-tag envelope &middot; structured writeback &middot; signed archive &middot; templates + rogue scan</li>
      </ul>
      <p>From here: <strong>About this build</strong> in the sidebar has the full submission memo. <strong>Reset demo data</strong> starts the contracts fresh. <strong>Take the tour</strong> restarts this any time.</p>
    `,
    next: "advance",
    nextLabel: "Finish",
  },
];

// ── State helpers ────────────────────────────────────────────────────────

export const TOUR_STATE_KEY = "tour-state";
export const TOUR_DISMISSED_KEY = "tour-dismissed";
export const TOUR_SEEN_KEY = "tour-seen";

export interface TourState {
  active: boolean;
  stepIndex: number;
}

export function readTourState(): TourState {
  if (typeof window === "undefined") return { active: false, stepIndex: 0 };
  try {
    const raw = window.localStorage.getItem(TOUR_STATE_KEY);
    if (!raw) return { active: false, stepIndex: 0 };
    const parsed = JSON.parse(raw) as Partial<TourState>;
    return {
      active: Boolean(parsed.active),
      stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : 0,
    };
  } catch {
    return { active: false, stepIndex: 0 };
  }
}

export function writeTourState(state: TourState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOUR_STATE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function isTourDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(TOUR_DISMISSED_KEY) === "true";
  } catch {
    return true;
  }
}

export function setTourDismissed(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(TOUR_DISMISSED_KEY, "true");
    } else {
      window.localStorage.removeItem(TOUR_DISMISSED_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * "Seen" is the once-only auto-start gate. It flips to true the moment the
 * tour starts for the first time (auto OR manual). Subsequent dashboard
 * visits do not re-auto-start regardless of completion/dismissal. The user
 * can still re-trigger manually via the sidebar or callout buttons.
 */
export function hasSeenTour(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === "true";
  } catch {
    return true;
  }
}

export function markTourSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, "true");
  } catch {
    // ignore
  }
}
