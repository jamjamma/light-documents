/**
 * Guided product tour steps.
 *
 * Each step is bound to a specific pathname + DOM selector. The TourController
 * mounts in the root layout, watches pathname + localStorage, and drives the
 * driver.js popover for the current step on each page.
 *
 * Hero contract: `c_bolt_msa` (high-risk, in-review, €180k MSA with 3 clause
 * deviations). Bolt's `lightEntity` is set to "Light ApS (Denmark)" in
 * mock-data so the Head of F&O slot routes to Martina Holst (the operator).
 * That means the user can Approve their own row and watch the Undo
 * affordance appear inline.
 *
 * The signed walkthrough jumps to `c_acme_msa/signed` because Bolt MSA
 * isn't fully signed yet and we don't want the tour to force the user
 * through the modal/Send flow.
 *
 * Descriptions support HTML (driver.js renders via innerHTML). Style guide:
 *  - Lead with one short sentence stating WHAT, no jargon
 *  - Use bullet lists for any structured content (>= 2 items)
 *  - Close with 1 italic sentence for production / caveat where useful
 *  - Max ~4 short paragraphs total
 *  - No em-dashes (project rule). Use colons / commas / periods.
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
  // ── Act 1: Dashboard (operator surface) ────────────────────────────────
  {
    id: "welcome",
    path: "/",
    title: "Welcome to Light Documents",
    description: `
      <p>A short walk through one contract, end-to-end. About 2 minutes.</p>
      <p>Press <kbd>Esc</kbd> or <strong>×</strong> to exit. Restart anytime via <em>Take the tour</em> in the sidebar.</p>
    `,
    next: "advance",
    nextLabel: "Start",
    hideBack: true,
  },
  {
    id: "answer",
    path: "/",
    title: "The answer, in two beats",
    description: `
      <p><strong>Stated problem.</strong> Manual Word edits, hand-placed DocuSign fields. This build eliminates both.</p>
      <p><strong>Strategic opportunity for Light.</strong> Every signed contract becomes structured data that flows back into the system of record. The PDF is the audit artifact; the data is the product.</p>
    `,
    next: "advance",
  },
  {
    id: "kpis",
    path: "/",
    selector: ".tour-anchor-kpis",
    side: "bottom",
    title: "Operator KPIs",
    description: `
      <p>Three tiles for what an ops lead actually acts on:</p>
      <ul>
        <li><strong>Awaiting me.</strong> Your queue.</li>
        <li><strong>Blocked.</strong> Approvers haven't responded.</li>
        <li><strong>In review.</strong> Clause check or legal review running.</li>
      </ul>
      <p>Click any tile to filter the table. Cycle health sits below as a leadership metric.</p>
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
      <p>Two filters compose: stage on top, document type below.</p>
      <p>The same workflow engine handles all 8 templates (MSA, NDA, Employment, Warrant, Order Form, plus variants). Same intake, same clause check, same writeback shape per type.</p>
    `,
    next: "advance",
  },
  {
    id: "new-contract-btn",
    path: "/",
    selector: ".tour-anchor-new-contract",
    side: "right",
    title: "Create a new contract",
    description: `
      <p>Intake is a 3-step flow:</p>
      <ul>
        <li>Pick a master template</li>
        <li>Pick a source record (or enter manually)</li>
        <li>Confirm prefilled fields</li>
      </ul>
      <p>Click <strong>Open intake</strong> to see the form.</p>
    `,
    next: "navigate",
    goto: "/contracts/new",
    nextLabel: "Open intake",
  },
  {
    id: "intake-walk",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-steps",
    side: "bottom",
    title: "3-step intake",
    description: `
      <ul>
        <li><strong>1. Template.</strong> 8 master Word docs synced from Drive.</li>
        <li><strong>2. Source record.</strong> Pulled from Salesforce / HubSpot / Personio. Or manual entry for off-CRM records.</li>
        <li><strong>3. Confirm.</strong> Prefilled fields with live validation. Clause check runs on submit.</li>
      </ul>
      <p>Once submitted, the workflow begins. Next, open a contract already in motion.</p>
    `,
    next: "navigate",
    goto: `/contracts/${HERO_CONTRACT_ID}`,
    nextLabel: "Open Bolt MSA",
  },

  // ── Act 2: Workflow (contract detail) ──────────────────────────────────
  {
    id: "clause-diff",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-clause-diff",
    side: "top",
    title: "Clause checker",
    description: `
      <p>Bolt MSA has 3 deviations from the master template:</p>
      <ul>
        <li><strong>Net 60</strong> (vs Net 30)</li>
        <li><strong>Unlimited liability</strong> (vs €500k cap)</li>
        <li><strong>Customer-only indemnity</strong> (vs mutual)</li>
      </ul>
      <p><em>In production, Claude proposes deviations; the rules engine decides who approves. Separation keeps it auditable.</em></p>
    `,
    next: "advance",
  },
  {
    id: "routing",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-routing",
    side: "top",
    title: "Routing rules",
    description: `
      <p>13 typed rules fire based on contract fields. Bolt triggers three:</p>
      <ul>
        <li><strong>Legal.</strong> Clause deviations flagged.</li>
        <li><strong>Head of F&amp;O.</strong> ARR &gt; €50k.</li>
        <li><strong>CFO.</strong> ARR &gt; €100k.</li>
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
    title: "Approval chain &middot; try Approve + Undo",
    description: `
      <p>Find the <strong>Head of Finance &amp; Ops</strong> row (Martina Holst). That's your row, so the button reads <strong>Approve</strong>, not Simulate.</p>
      <p>Click Approve. The pill flips green and an <strong>Undo</strong> appears next to it. Other rows show <em>Simulate X approves</em> because they represent Slack DM responses from other people; only your own approval is Undo-able.</p>
      <p><em>Once DocuSign has the envelope, Undo is refused. That's the line.</em></p>
    `,
    next: "advance",
  },
  {
    id: "preview-envelope",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-preview-envelope",
    side: "top",
    title: "Anchor-tag envelope",
    description: `
      <p><strong>Preview envelope</strong> shows the populated MSA with signature fields auto-placed by anchor tags Counsel typed once into the Word template. Config (expiry, reminders, QES) sits behind a collapsed audit disclosure.</p>
      <p>Bolt isn't fully approved yet. Skipping ahead to a signed contract.</p>
    `,
    next: "navigate",
    goto: `/contracts/${SIGNED_DEMO_ID}/signed`,
    nextLabel: "See signed contract",
  },

  // ── Act 3: Outputs ─────────────────────────────────────────────────────
  {
    id: "structured-writeback",
    path: `/contracts/${SIGNED_DEMO_ID}/signed`,
    selector: ".tour-anchor-ledger",
    side: "left",
    title: "Structured writeback",
    description: `
      <p>Every signed contract emits structured data into the relevant system of record:</p>
      <ul>
        <li><strong>MSA / Order Form.</strong> Ledger journal entry plus customer, source, entity, renewal as dimensions.</li>
        <li><strong>Employment.</strong> HRIS record (start date, role, comp, manager).</li>
        <li><strong>Warrant.</strong> Cap-table grant (stakeholder, percentage, vesting, board resolution).</li>
        <li><strong>NDA.</strong> Retention metadata only. No commercial impact.</li>
      </ul>
      <p><em>The prototype emits this on the DocuSign <code>envelope-completed</code> webhook. Production posts to whichever endpoint Light exposes. The integration target is also stubbed in this build.</em></p>
    `,
    next: "navigate",
    goto: "/archive",
    nextLabel: "Past contracts",
  },
  {
    id: "signed-archive",
    path: "/archive",
    title: "Past signed contracts",
    description: `
      <p>Filed contracts live here for retrieval. KPIs are <strong>counts</strong>, not financial totals.</p>
      <p>ARR, headcount, and equity totals live on Light's real dashboards. This surface is for finding past records: who signed, when, against which template version.</p>
      <p>Each row links to its full signed record: PDF, audit trail, structured writeback.</p>
    `,
    next: "navigate",
    goto: "/templates",
    nextLabel: "Templates",
  },
  {
    id: "templates",
    path: "/templates",
    title: "Templates &middot; Counsel keeps Word",
    description: `
      <p>Master templates live as Word docs in Drive, owned by Legal. <strong>Counsel never logs into Light Documents</strong>: they edit where they already edit, with Track Changes and all. Our platform watches the folder and syncs.</p>
      <p>Scroll down for the <strong>Rogue templates</strong> panel: a Phase-2 governance demo. A daily scan flags docs outside <code>/Master Templates/</code> with Archive + Notify Owner actions.</p>
    `,
    next: "advance",
    nextLabel: "Wrap up",
  },

  // ── Wrap up ────────────────────────────────────────────────────────────
  {
    id: "done",
    path: "*",
    title: "Tour complete",
    description: `
      <p>You've seen:</p>
      <ul>
        <li><strong>Operator dashboard.</strong> KPIs, stage tabs, type chips.</li>
        <li><strong>Intake.</strong> Templates, source records, prefilled fields.</li>
        <li><strong>Workflow.</strong> Clause check, routing, approvals, Undo, anchor-tag envelope.</li>
        <li><strong>Outputs.</strong> Structured writeback, signed archive, template governance.</li>
      </ul>
      <p><strong>Where to next.</strong> The sidebar holds <em>About this build</em> (the full submission memo) and <em>Reset demo data</em> (wipes everything, lets you take the tour again).</p>
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

/**
 * Wipe every tour-related flag. Called from Reset demo data so a single
 * click returns the operator to a first-visit-ever state (tour will
 * auto-start again on next dashboard load).
 */
export function resetTourState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOUR_STATE_KEY);
    window.localStorage.removeItem(TOUR_DISMISSED_KEY);
    window.localStorage.removeItem(TOUR_SEEN_KEY);
  } catch {
    // ignore
  }
}
