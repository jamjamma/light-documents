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
      <p class="lead">A 90-second walk, menu by menu.</p>
      <p class="muted"><kbd>Esc</kbd> to exit. Restart anytime via <em>Take the tour</em>.</p>
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
      <ul>
        <li><strong>Awaiting me.</strong> Your queue.</li>
        <li><strong>Blocked.</strong> No approver response.</li>
        <li><strong>In review.</strong> Clause check or legal.</li>
      </ul>
      <p class="muted">Click any tile to filter the table.</p>
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
      <ul>
        <li><strong>Stage tabs.</strong> All in-flight / Awaiting me / Blocked / In review.</li>
        <li><strong>Type chips.</strong> MSA, Order Form, NDA, Employment, Warrant.</li>
      </ul>
      <p class="muted">Same engine handles all 8 templates.</p>
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
      <ul>
        <li><strong>Dashboard.</strong> In-flight queue.</li>
        <li><strong>Templates.</strong> Catalog plus rogue governance.</li>
        <li><strong>Signed contracts.</strong> Past records.</li>
        <li><strong>About.</strong> Submission memo.</li>
      </ul>
      <p class="muted">Bottom: New contract, Take the tour, Reset demo.</p>
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
      <p>Your queue: contracts where Martina's approval is next.</p>
      <p class="muted">In production, Slack is the action layer; the dashboard is the catch-up view.</p>
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
      <p>Contracts an approver hasn't responded to.</p>
      <p class="muted">Rows sitting 3+ days get a <em>stale</em> badge.</p>
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
      <p>Clause checker or counsel actively reviewing.</p>
      <p><strong>Bolt MSA</strong>: EUR 180k, 3 clause deviations. Hero example for the workflow walk.</p>
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
      <p>3 deviations vs the master template:</p>
      <ul>
        <li>Net 60 (vs Net 30)</li>
        <li>Unlimited liability (vs EUR 500k cap)</li>
        <li>Customer-only indemnity (vs mutual)</li>
      </ul>
      <p class="muted"><em>Claude proposes; the rules engine decides who approves.</em></p>
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
      <p>Bolt triggers 3 of 13 rules:</p>
      <ul>
        <li><strong>Legal.</strong> Clause deviations.</li>
        <li><strong>Head of F&amp;O.</strong> ARR &gt; EUR 50k.</li>
        <li><strong>CFO.</strong> ARR &gt; EUR 100k.</li>
      </ul>
      <p class="muted">Each row carries its <em>why</em> for the audit log.</p>
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
      <ul>
        <li>Find the <strong>Martina Holst</strong> row (Head of F&amp;O).</li>
        <li>Click <strong>Approve</strong>. Pill flips green; <strong>Undo</strong> appears.</li>
        <li>Other rows show <em>Simulate</em> (DM responses from others).</li>
      </ul>
      <p class="muted"><em>Once DocuSign has the envelope, Undo is refused.</em></p>
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
      <p>Click <strong>Preview envelope</strong> below: populated MSA with signature fields auto-placed by anchor tags from the Word template.</p>
      <p class="muted">Config (expiry, reminders, QES) sits behind a collapsed audit disclosure. Close the modal, then click Next.</p>
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
      <p>Retrieval surface for past records.</p>
      <ul>
        <li>KPIs are <strong>counts</strong>, not financial totals.</li>
        <li>Each row links to PDF, audit trail, writeback.</li>
      </ul>
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
      <ul>
        <li><strong>MSA / Order Form.</strong> Ledger journal entry plus dimensions.</li>
        <li><strong>Employment.</strong> HRIS record.</li>
        <li><strong>Warrant.</strong> Cap-table grant.</li>
        <li><strong>NDA.</strong> Retention metadata only.</li>
      </ul>
      <p class="muted"><em>Fires on DocuSign <code>envelope-completed</code>. Both sides of the integration are stubbed in this build.</em></p>
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
      <ul>
        <li><strong>1. Template.</strong> 8 master Word docs.</li>
        <li><strong>2. Source record.</strong> Salesforce, HubSpot, Personio, or manual.</li>
        <li><strong>3. Confirm.</strong> Prefilled fields, clause check on submit.</li>
      </ul>
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
      <ul>
        <li><strong>Master templates.</strong> Word docs in Drive, owned by Legal.</li>
        <li><strong>Counsel keeps Word for authoring.</strong> They may still log in to approve a deviation; what stays out is authoring, not review.</li>
        <li><strong>Rogue panel</strong> (scroll down). Daily scan flags docs outside <code>/Master Templates/</code>.</li>
      </ul>
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
      <ul>
        <li><strong>Dashboard.</strong> KPIs, filters, sidebar.</li>
        <li><strong>Filter walk.</strong> Awaiting me, Blocked, In review.</li>
        <li><strong>Workflow.</strong> Clause check, routing, approvals, envelope.</li>
        <li><strong>Outputs.</strong> Archive and structured writeback.</li>
        <li><strong>Intake.</strong> 3-step new-contract form.</li>
        <li><strong>Templates.</strong> Drive-backed plus rogue governance.</li>
      </ul>
      <p class="muted">Re-take from the sidebar anytime.</p>
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
