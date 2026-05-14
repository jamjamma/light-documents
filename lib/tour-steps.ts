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
/**
 * Bolt becomes signed during the tour (the user clicks through Approve →
 * Preview → Send), so the signed walkthrough uses Bolt itself. Acme is no
 * longer needed as a stand-in; the archive walkthrough lands the user on
 * Bolt's own signed page after Send fires.
 */

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
  | "filter:in_review"
  | "archive:filter:all"
  | "archive:filter:customer"
  | "archive:filter:people"
  | "archive:filter:equity";

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
      <p class="lead">A 2-minute walk through Light Documents, end-to-end.</p>
      <p class="muted"><kbd>Esc</kbd> to exit. Restart anytime via <em>Take the tour</em> in the sidebar.</p>
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
    selector: ".tour-anchor-kpi-awaiting",
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
    selector: ".tour-anchor-kpi-blocked",
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
    selector: ".tour-anchor-kpi-in-review",
    side: "bottom",
    title: "In review",
    description: `
      <p>Clause checker or counsel actively reviewing.</p>
      <p><strong>Bolt MSA</strong>: EUR 180k, 3 clause deviations. Hero example. We'll walk it all the way to signed.</p>
    `,
    next: "navigate",
    goto: `/contracts/${HERO_CONTRACT_ID}`,
    nextLabel: "Open Bolt MSA",
    effect: "filter:in_review",
  },

  // ── Act 3: Walk Bolt MSA to signed ────────────────────────────────────
  {
    id: "clause-diff",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-clause-diff",
    side: "top",
    title: "Clause checker",
    description: `
      <p>3 deviations vs the master template. <strong>Click each row</strong> to expand the reason:</p>
      <ul>
        <li><strong>Net 60</strong> (vs Net 30)</li>
        <li><strong>Unlimited liability</strong> (vs EUR 500k cap)</li>
        <li><strong>Customer-only indemnity</strong> (vs mutual)</li>
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
    title: "Approve all the approvers",
    description: `
      <ul>
        <li>Find the <strong>Martina Holst</strong> row. Click <strong>Approve</strong>.</li>
        <li>Pill flips green; <strong>Undo</strong> appears next to it.</li>
        <li>For the other rows, click <strong>Simulate X approves</strong>. They represent Slack DM responses.</li>
        <li>Once everyone is green, the Send button unlocks.</li>
      </ul>
      <p class="muted"><em>Click Next when all rows are approved.</em></p>
    `,
    next: "advance",
  },
  {
    id: "preview-envelope",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-preview-envelope",
    side: "top",
    title: "Preview the envelope",
    description: `
      <p>Click <strong>Preview envelope</strong> below: populated MSA with signature fields auto-placed by anchor tags from the Word template.</p>
      <p class="muted">Config (expiry, reminders, QES) sits behind a collapsed audit disclosure inside the modal.</p>
    `,
    next: "advance",
    nextLabel: "Next: send",
  },
  {
    id: "send-envelope",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-preview-envelope",
    side: "top",
    title: "Send via DocuSign",
    description: `
      <p>In the modal, click <strong>Send via DocuSign</strong>. The contract advances to signed and you'll auto-redirect to the signed page.</p>
      <p class="muted"><em>If you closed the modal, click Preview envelope again, then Send.</em></p>
    `,
    next: "advance",
    nextLabel: "Waiting…",
  },

  // ── Act 4: Bolt's own signed page ─────────────────────────────────────
  {
    id: "bolt-signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-ledger",
    side: "left",
    title: "Structured writeback",
    description: `
      <p>Bolt is signed. Each signed contract emits structured data:</p>
      <ul>
        <li><strong>MSA / Order Form.</strong> Ledger journal entry plus dimensions.</li>
        <li><strong>Employment.</strong> HRIS record.</li>
        <li><strong>Warrant.</strong> Cap-table grant.</li>
        <li><strong>NDA.</strong> Retention metadata only.</li>
      </ul>
      <p class="muted"><em>Fires on DocuSign <code>envelope-completed</code>. Both sides of the integration are stubbed in this build.</em></p>
    `,
    next: "navigate",
    goto: "/archive",
    nextLabel: "Next: archive",
  },

  // ── Act 5: Signed contracts archive ───────────────────────────────────
  {
    id: "archive-overview",
    path: "/archive",
    title: "Signed contracts archive",
    description: `
      <p>Bolt is now alongside the other signed records.</p>
      <ul>
        <li><strong>KPI tiles.</strong> Counts by category, not financial totals.</li>
        <li><strong>Filter chips.</strong> All, Customer, People, Equity.</li>
        <li><strong>Section view</strong> when All is selected, grouped by category.</li>
      </ul>
    `,
    next: "advance",
    effect: "archive:filter:all",
  },
  {
    id: "archive-customer",
    path: "/archive",
    selector: ".tour-anchor-archive-filters",
    side: "bottom",
    title: "Customer contracts",
    description: `
      <p>MSAs, Order Forms, NDAs. Each emits a ledger journal entry on file.</p>
      <p class="muted">Bolt MSA, Quantum Analytics MSA, Linear MSA all sit here.</p>
    `,
    next: "advance",
    effect: "archive:filter:customer",
  },
  {
    id: "archive-people",
    path: "/archive",
    selector: ".tour-anchor-archive-filters",
    side: "bottom",
    title: "People",
    description: `
      <p>Employment offers. Each emits an HRIS record on file.</p>
      <p class="muted">Erin O'Brien and Oliver Adekunle offers sit here.</p>
    `,
    next: "advance",
    effect: "archive:filter:people",
  },
  {
    id: "archive-equity",
    path: "/archive",
    selector: ".tour-anchor-archive-filters",
    side: "bottom",
    title: "Equity",
    description: `
      <p>Warrant agreements. Each emits a cap-table grant on file.</p>
      <p class="muted">None signed yet in this demo; the section appears when one is filed.</p>
    `,
    next: "navigate",
    goto: "/templates",
    nextLabel: "Next: templates",
    effect: "archive:filter:equity",
  },

  // ── Act 6: Templates + rogue governance ───────────────────────────────
  {
    id: "templates-overview",
    path: "/templates",
    title: "Templates catalog",
    description: `
      <p>8 master Word docs in Drive, organized by category:</p>
      <ul>
        <li><strong>Customer.</strong> MSA, MSA Pilot, Order Form, NDA.</li>
        <li><strong>People.</strong> Employment DK, Employment UK.</li>
        <li><strong>Equity.</strong> Warrant, Advisor Warrant.</li>
      </ul>
      <p class="muted">Click any card for version history, clause rules, DocuSign config.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-counsel",
    path: "/templates",
    title: "Counsel keeps Word for authoring",
    description: `
      <p>Master templates stay as Word docs in Drive, edited where Counsel already edits.</p>
      <p class="muted">Counsel may still log in to approve a clause deviation when one is routed to them. What stays out is authoring, not review.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-rogue",
    path: "/templates",
    selector: ".tour-anchor-rogue",
    side: "top",
    title: "Rogue templates governance",
    description: `
      <p>Daily scan flags docs outside <code>/Master Templates/</code> that look like masters but aren't.</p>
      <ul>
        <li><strong>Archive.</strong> Mark out of policy.</li>
        <li><strong>Notify Owner.</strong> Slack DM with the diff and a remediation link.</li>
      </ul>
      <p class="muted"><em>Phase-2 governance demo. Audit log preserves both decisions.</em></p>
    `,
    next: "navigate",
    goto: "/contracts/new",
    nextLabel: "Next: new contract",
  },

  // ── Act 7: New contract intake ────────────────────────────────────────
  {
    id: "intake-walk",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-steps",
    side: "bottom",
    title: "Create a new contract",
    description: `
      <ul>
        <li><strong>1. Template.</strong> Pick one of the 8 masters.</li>
        <li><strong>2. Source record.</strong> From Salesforce, HubSpot, Personio, or manual entry.</li>
        <li><strong>3. Confirm.</strong> Prefilled fields, clause check on submit.</li>
      </ul>
      <p class="muted">Same workflow as Bolt begins on submit.</p>
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
        <li><strong>Workflow.</strong> Clause check, routing, approvals, envelope, send.</li>
        <li><strong>Signed.</strong> Bolt's writeback then the full archive by category.</li>
        <li><strong>Templates.</strong> Catalog + Counsel-keeps-Word + rogue governance.</li>
        <li><strong>Intake.</strong> 3-step new-contract form.</li>
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
