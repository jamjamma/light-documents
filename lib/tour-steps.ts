/**
 * Guided product tour steps.
 *
 * Each step is bound to a specific pathname + DOM selector. The TourController
 * mounts in the root layout, watches pathname + localStorage, and drives the
 * driver.js popover for the current step on each page.
 *
 * Structure: menu-by-menu. Act 1 orients the dashboard chrome. Act 2 demos
 * each stage filter on the dashboard (with the controller firing
 * `tour:effect` events the dashboard listens for, so the table actually
 * filters as we narrate). Act 3 walks the workflow on Bolt MSA. Act 4
 * shows the new-contract intake. Act 5 shows outputs via the signed-
 * contracts archive (so the transition into a signed page is natural,
 * not a teleport).
 *
 * Hero contract: `c_bolt_msa` (high-risk, in-review, EUR 180k MSA with 3 clause
 * deviations). Bolt's `lightEntity` is set to "Light ApS (Denmark)" in
 * mock-data so the Head of F&O slot routes to Martina Holst (the operator).
 * That means the user can Approve their own row and watch the Undo
 * affordance appear inline.
 *
 * Outputs are demoed on `c_acme_msa/signed`. We reach it by navigating
 * through `/archive` first, so the user sees the row they're about to
 * click into rather than getting teleported from a different contract's
 * preview step.
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

/**
 * Side-effects the controller can fire when a step renders. The dashboard
 * (and any other page that wants to participate) listens for
 * `window.addEventListener("tour:effect", ...)` with `event.detail.effect`
 * set to one of these strings.
 *
 * Effect handlers MUST be idempotent and reversible: a user clicking Back
 * may re-render an earlier step that fires its effect again.
 */
export type TourEffect =
  | "filter:all"
  | "filter:awaiting_me"
  | "filter:blocked"
  | "filter:in_review";

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
  /**
   * Side-effect to fire when this step renders. The controller dispatches
   * a `tour:effect` custom event with `{ effect }` in the detail. Listeners
   * (e.g. the dashboard) act on it.
   */
  effect?: TourEffect;
}

export const TOUR_STEPS: TourStep[] = [
  // ── Act 1: Orient (dashboard chrome) ──────────────────────────────────
  {
    id: "welcome",
    path: "/",
    title: "Welcome",
    description: `
      <p class="lead">A short walk through Light Documents, menu by menu. About 90 seconds.</p>
      <p class="muted">Use <kbd>Esc</kbd> or the <strong>&times;</strong> to exit. You can restart anytime from <em>Take the tour</em> in the sidebar.</p>
    `,
    next: "advance",
    nextLabel: "Start",
    hideBack: true,
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
      <p>Each tile is clickable: it filters the table below. Cycle health (avg create-to-signed) sits as a secondary line beneath, since it's a leadership metric, not a daily action.</p>
    `,
    next: "advance",
    effect: "filter:all",
  },
  {
    id: "table-filters",
    path: "/",
    selector: ".tour-anchor-table-filters",
    side: "bottom",
    title: "Stage tabs and type chips",
    description: `
      <p>Two filters compose: stage on top, document type below.</p>
      <p>The same workflow engine handles all 8 templates (NDA, MSA, MSA Pilot, Order Form, Employment DK, Employment UK, Warrant, Advisor Warrant). Same intake, same clause check, same writeback shape per type.</p>
    `,
    next: "advance",
  },
  {
    id: "sidebar-overview",
    path: "/",
    selector: ".tour-anchor-sidebar-nav",
    side: "right",
    title: "The sidebar",
    description: `
      <p>Four destinations:</p>
      <ul>
        <li><strong>Dashboard.</strong> The in-flight queue (here).</li>
        <li><strong>Templates.</strong> Master template catalog plus rogue-template governance.</li>
        <li><strong>Signed contracts.</strong> Retrieval surface for past records.</li>
        <li><strong>About this build.</strong> The full submission memo.</li>
      </ul>
      <p>Below the divider: <strong>New contract</strong>, <strong>Take the tour</strong> (you can re-trigger from here), and <strong>Reset demo data</strong>.</p>
    `,
    next: "advance",
  },

  // ── Act 2: Filter walk ────────────────────────────────────────────────
  {
    id: "filter-awaiting-me",
    path: "/",
    selector: ".tour-anchor-kpis",
    side: "bottom",
    title: "Awaiting me",
    description: `
      <p>Filtered to <strong>your queue</strong>: contracts where Martina's approval is the next thing blocking the workflow.</p>
      <p>In production each row links to the same contract detail you'd reach from a Slack notification. The Slack notification is the action layer; the dashboard is the catch-up view.</p>
    `,
    next: "advance",
    effect: "filter:awaiting_me",
  },
  {
    id: "filter-blocked",
    path: "/",
    selector: ".tour-anchor-kpis",
    side: "bottom",
    title: "Blocked",
    description: `
      <p>Filtered to contracts where an approver hasn't responded yet.</p>
      <p>Rows that have sat for 3+ days get a <em>stale</em> badge so urgency stays visible even without a separate column.</p>
    `,
    next: "advance",
    effect: "filter:blocked",
  },
  {
    id: "filter-in-review",
    path: "/",
    selector: ".tour-anchor-kpis",
    side: "bottom",
    title: "In review",
    description: `
      <p>Filtered to contracts the clause checker or counsel is actively reviewing.</p>
      <p><strong>Bolt MSA</strong> is the hero example: a EUR 180k customer MSA with 3 clause deviations from the master template. Click Next to open it and walk the workflow.</p>
    `,
    next: "navigate",
    goto: `/contracts/${HERO_CONTRACT_ID}`,
    nextLabel: "Open Bolt MSA",
    effect: "filter:in_review",
  },

  // ── Act 3: Workflow walk (Bolt MSA) ───────────────────────────────────
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
        <li><strong>Unlimited liability</strong> (vs EUR 500k cap)</li>
        <li><strong>Customer-only indemnity</strong> (vs mutual)</li>
      </ul>
      <p><em>In production Claude proposes deviations; the rules engine decides who approves. Separating the two keeps it auditable.</em></p>
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
        <li><strong>Head of F&amp;O.</strong> ARR &gt; EUR 50k.</li>
        <li><strong>CFO.</strong> ARR &gt; EUR 100k.</li>
      </ul>
      <p>Each row carries its <em>why</em> for the audit log. Head of F&amp;O owns this engine in production.</p>
    `,
    next: "advance",
  },
  {
    id: "approval-chain",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-approval-chain",
    side: "top",
    title: "Approve, then Undo",
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
      <p><strong>Click Preview envelope</strong> below to see the populated MSA with signature fields auto-placed by anchor tags Counsel typed once into the Word template. Config (expiry, reminders, QES) sits behind a collapsed audit disclosure.</p>
      <p>Close the modal when you're done, then click <strong>Next</strong> to look at outputs.</p>
    `,
    next: "navigate",
    goto: "/archive",
    nextLabel: "Next: outputs",
  },

  // ── Act 4: Outputs (signed contracts + structured writeback) ──────────
  {
    id: "signed-archive",
    path: "/archive",
    title: "Signed contracts",
    description: `
      <p>Past signed contracts live here for retrieval. KPIs are <strong>counts</strong>, not financial totals: ARR, headcount, and equity totals belong on Light's real dashboards.</p>
      <p>Each row links to its signed record: PDF, audit trail, structured writeback. Click Next to open Acme MSA's signed page.</p>
    `,
    next: "navigate",
    goto: `/contracts/${SIGNED_DEMO_ID}/signed`,
    nextLabel: "Open Acme MSA",
  },
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
      <p><em>The prototype emits this on the DocuSign <code>envelope-completed</code> webhook. Production posts to whichever endpoint Light exposes. Both sides of the integration are stubbed in this build.</em></p>
    `,
    next: "navigate",
    goto: "/contracts/new",
    nextLabel: "Next: new contract",
  },

  // ── Act 5: New contract intake ────────────────────────────────────────
  {
    id: "intake-walk",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-steps",
    side: "bottom",
    title: "Create a new contract",
    description: `
      <p>The 3-step new-contract form:</p>
      <ul>
        <li><strong>1. Template.</strong> 8 master Word docs synced from Drive.</li>
        <li><strong>2. Source record.</strong> Pulled from Salesforce / HubSpot / Personio. Or manual entry for off-CRM records.</li>
        <li><strong>3. Confirm.</strong> Prefilled fields with live validation. Clause check runs on submit.</li>
      </ul>
      <p>Once submitted, the same workflow you just walked through begins.</p>
    `,
    next: "navigate",
    goto: "/templates",
    nextLabel: "Next: templates",
  },
  {
    id: "templates",
    path: "/templates",
    title: "Templates and rogue governance",
    description: `
      <p>Master templates live as Word docs in Drive, owned by Legal. <strong>Counsel keeps Word for authoring</strong>: they edit where they already edit, with Track Changes and all. Our platform watches the folder and syncs. (Counsel may still log in to approve a clause deviation when one is routed to them; what stays out is authoring, not review.)</p>
      <p>Scroll down for the <strong>Rogue templates</strong> panel: a Phase-2 governance demo. A daily scan flags docs outside <code>/Master Templates/</code> with Archive + Notify Owner actions.</p>
    `,
    next: "advance",
    nextLabel: "Wrap up",
  },

  // ── Wrap up ───────────────────────────────────────────────────────────
  {
    id: "done",
    path: "*",
    title: "Tour complete",
    description: `
      <p>You've seen:</p>
      <ul>
        <li><strong>Dashboard.</strong> KPIs, stage tabs, type chips, sidebar.</li>
        <li><strong>Filter walk.</strong> Awaiting me, Blocked, In review.</li>
        <li><strong>Workflow.</strong> Clause check, routing, approvals, Undo, anchor-tag envelope.</li>
        <li><strong>Outputs.</strong> Signed archive, structured writeback.</li>
        <li><strong>Intake.</strong> 3-step new-contract form.</li>
        <li><strong>Templates.</strong> Drive-backed master templates, rogue governance.</li>
      </ul>
      <p>Re-take the tour anytime from the sidebar. <em>Reset demo data</em> wipes state and re-seeds.</p>
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
