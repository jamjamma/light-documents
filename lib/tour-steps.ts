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
  | "archive:filter:equity"
  // Open the DocuSign envelope preview modal on the contract detail page.
  // Idempotent: firing this when the modal is already open is a no-op.
  | "modal:open"
  // Programmatically expand the Envelope-configuration <details> in the
  // preview modal so driver.js highlights the full disclosure, not the
  // collapsed 1-line summary.
  | "modal:expand-config"
  // Scroll the modal's overflow-y-auto container so the anchor-tags bar is
  // visible. driver.js's smoothScroll handles window scrolling but not
  // nested scroll containers.
  | "modal:scroll-anchortags";

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
      <p>Clause checker or counsel actively reviewing. The table below now shows the single In-review contract.</p>
    `,
    next: "advance",
    effect: "filter:in_review",
  },
  {
    id: "hero-row",
    path: "/",
    selector: ".tour-anchor-hero-row",
    side: "top",
    title: "Bolt MSA",
    description: `
      <p>EUR 180k customer MSA with 3 clause deviations.</p>
      <p class="muted">This is our hero example. We'll walk it from in-review all the way to signed.</p>
    `,
    next: "navigate",
    goto: `/contracts/${HERO_CONTRACT_ID}`,
    nextLabel: "Open Bolt MSA",
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
    title: "Approve every approver",
    description: `
      <ul>
        <li>Find the <strong>Martina Holst</strong> row. Click <strong>Approve</strong>.</li>
        <li>Pill flips green; <strong>Undo</strong> appears next to it.</li>
        <li>For the other rows, click <strong>Simulate X approves</strong>. They represent Slack DM responses.</li>
        <li>Once every row is green, the Send button unlocks.</li>
      </ul>
      <p class="muted"><strong>Don't skip rows.</strong> If you click Next with pending approvals, the Send button will be greyed out at the next step and you'll have to come back here.</p>
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
      <p>The DocuSign envelope preview opens. We'll walk through what's inside before sending.</p>
      <p class="muted"><strong>Send is greyed out?</strong> Approvals are not complete. Click <strong>Back</strong> and finish the chain (every row green) before re-opening the preview.</p>
    `,
    next: "advance",
    // Auto-open the modal so the next step's anchors exist when polled.
    effect: "modal:open",
  },

  // ── Act 4: DocuSign preview modal walk ────────────────────────────────
  {
    id: "modal-recipients",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-modal-recipients",
    side: "right",
    title: "Recipients and routing",
    description: `
      <ul>
        <li>Counterparty signer (amber) routes first.</li>
        <li>Light authorised signatory (sky) routes second.</li>
        <li>Each row shows the <em>why</em>: source record, jurisdiction, or template policy.</li>
      </ul>
      <p class="muted">Sequential routing; reminders kick in by day 3.</p>
    `,
    next: "advance",
    effect: "modal:open",
  },
  {
    id: "modal-config",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-modal-config",
    side: "right",
    title: "Envelope configuration",
    description: `
      <p>Audit-view disclosure. Expiry, reminder schedule, signing order, and any extras (eIDAS QES, SMS OTP, witness).</p>
      <p class="muted">Defaults come from the template's DocuSign feature config.</p>
    `,
    next: "advance",
    // Pre-expand the <details> before driver.js anchors so the highlight
    // wraps the open panel, not the collapsed 1-line summary.
    effect: "modal:expand-config",
  },
  {
    id: "modal-document",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-modal-document",
    side: "left",
    title: "Populated document",
    description: `
      <p>The signed PDF preview. All variables substituted; signature fields auto-placed by anchor tags.</p>
      <p class="muted">Use the page nav below to flip through. Page numbers vary by template type.</p>
    `,
    next: "advance",
    effect: "modal:open",
  },
  {
    id: "modal-anchortags",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-modal-anchortags",
    side: "top",
    title: "Anchor tags",
    description: `
      <p>White-on-white text in the Word template that DocuSign matches via <code>searchString</code> to place signature, date, and initial fields.</p>
      <p class="muted">Counsel types these once into the master. Zero per-contract dragging.</p>
    `,
    next: "advance",
    // Scrolls the inner overflow-y-auto modal container so the bar is in view.
    effect: "modal:scroll-anchortags",
  },
  {
    id: "modal-send",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-modal-send",
    side: "top",
    title: "Send via DocuSign",
    description: `
      <p>Click <strong>Send via DocuSign</strong>. The envelope fires, the contract advances to signed, and the page redirects to the signed record. The tour will follow.</p>
      <p class="muted"><strong>Send still disabled?</strong> Approvals are incomplete. Click <strong>Back</strong> (or close this modal) and return to the approval chain. Approve every row, then re-open the preview from the contract page.</p>
    `,
    next: "advance",
    effect: "modal:open",
  },

  // ── Act 5: Bolt's signed page ─────────────────────────────────────────
  {
    id: "signed-banner",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-signed-banner",
    side: "bottom",
    title: "Signed and filed",
    description: `
      <p>Banner confirms the envelope ID, signed timestamp, Drive storage, and eIDAS QES verification.</p>
      <p class="muted">Stage badge moves to <em>Filed</em>.</p>
    `,
    next: "advance",
  },
  {
    id: "signed-document",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-signed-document",
    side: "right",
    title: "Signed PDF",
    description: `
      <p>The retained PDF with metadata: template version, signer count, eIDAS QES badge.</p>
      <p class="muted">Download fetches both the PDF and DocuSign Certificate of Completion.</p>
    `,
    next: "advance",
  },
  {
    id: "audit-trail",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail",
    side: "right",
    title: "Audit trail",
    description: `
      <p>Append-only event log: every state transition the contract went through, from intake to filed.</p>
      <ul>
        <li><strong>Timestamps.</strong> Every transition recorded to the second.</li>
        <li><strong>Actor.</strong> Real person (Martina, Magnus, Sara) for human decisions; system for automated transitions (routing fired, clauses checked, envelope completed); counterparty for external events.</li>
        <li><strong>Channel.</strong> How the notification fired (Slack DM, email, DocuSign Connect webhook).</li>
        <li><strong>Why-line.</strong> Each row carries the rule or rationale that triggered it.</li>
      </ul>
      <p class="muted"><em>Append-only. Even Undo writes a new row ("withdrew approval") rather than mutating the prior one. 7-year retention. WORM compliant for finance regulators.</em></p>
    `,
    next: "advance",
  },
  {
    id: "structured-writeback",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-ledger",
    side: "left",
    title: "Structured writeback",
    description: `
      <p>Each signed contract emits structured data into the relevant system of record:</p>
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
    nextLabel: "Next",
  },

  // ── Act 5: Signed contracts archive ───────────────────────────────────
  {
    id: "archive-overview",
    path: "/archive",
    selector: ".tour-anchor-archive-bolt-row",
    side: "bottom",
    title: "Bolt MSA, now filed",
    description: `
      <p>Bolt sits alongside the other signed records (highlighted here). The journal-entry line beneath shows what the writeback emitted.</p>
      <ul>
        <li><strong>KPI tiles above.</strong> Counts by category, not financial totals.</li>
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
    nextLabel: "Next",
    effect: "archive:filter:equity",
  },

  // ── Act 6: Templates walked section by section ────────────────────────
  {
    id: "templates-overview",
    path: "/templates",
    title: "Templates catalog",
    description: `
      <p>8 master Word docs in Drive, grouped into three categories:</p>
      <ul>
        <li><strong>Customer contracts.</strong> MSA, MSA Pilot, Order Form, NDA.</li>
        <li><strong>People.</strong> Employment DK, Employment UK.</li>
        <li><strong>Equity.</strong> Warrant, Advisor Warrant.</li>
      </ul>
      <p class="muted">Click any card for version history, clause rules, DocuSign config.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-customer",
    path: "/templates",
    selector: ".tour-anchor-templates-customer",
    side: "top",
    title: "Customer contracts",
    description: `
      <ul>
        <li><strong>MSA v4.2.</strong> Standard commercial deal. 5 clause rules, 8 anchor tags.</li>
        <li><strong>MSA: Pilot v1.0.</strong> 3-month POC trials.</li>
        <li><strong>Order Form v2.0.</strong> Pricing companion to the MSA. References parent MSA.</li>
        <li><strong>Mutual NDA v3.1.</strong> 24-month confidentiality. No ledger writeback.</li>
      </ul>
      <p class="muted">Owned by Sales + Legal. 3 jurisdictions supported.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-people",
    path: "/templates",
    selector: ".tour-anchor-templates-people",
    side: "top",
    title: "People",
    description: `
      <ul>
        <li><strong>Employment DK v2.0.</strong> Denmark hires under Funktionærloven.</li>
        <li><strong>Employment UK v1.0.</strong> United Kingdom hires.</li>
      </ul>
      <p class="muted">Owned by People Ops + Legal. Jurisdiction-specific clauses. SMS OTP identity verification.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-equity",
    path: "/templates",
    selector: ".tour-anchor-templates-equity",
    side: "top",
    title: "Equity",
    description: `
      <ul>
        <li><strong>Warrant v1.5.</strong> Employee warrants. 48-month vest, 12-month cliff.</li>
        <li><strong>Advisor Warrant v1.0.</strong> Advisor grants. Different vest schedule.</li>
      </ul>
      <p class="muted">Owned by Finance + Legal. eIDAS QES required (Light policy for equity). Witness signer.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-counsel",
    path: "/templates",
    selector: ".tour-anchor-counsel-section",
    side: "bottom",
    title: "Counsel keeps Word for authoring",
    description: `
      <p>This panel explains how Word documents connect. Master templates stay as <code>.docx</code> in Drive, edited where Counsel already edits. The Drive Watch API fires a webhook on every save; our platform parses the docx, extracts <code>{{variables}}</code> and <code>\\sig:anchor\\</code> tags, and caches.</p>
      <p class="muted">The Legal team (illustrated in this demo by Sara Friis) may still log in to approve a clause deviation when one is routed to them. What stays out is authoring, not review.</p>
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
    nextLabel: "Next",
  },

  // ── Act 7: New contract intake ────────────────────────────────────────
  {
    id: "intake-walk",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-steps",
    side: "bottom",
    title: "Create a new contract",
    description: `
      <p>3 steps. The progress bar above tracks where you are.</p>
      <ul>
        <li><strong>1. Template.</strong> Pick from the 8 masters you just saw.</li>
        <li><strong>2. Source record.</strong> Pull from Salesforce, HubSpot, Personio, or enter manually.</li>
        <li><strong>3. Confirm.</strong> Pre-filled fields by type (Counterparty, Commercial terms, Legal, Counterparty signer for MSAs; Candidate, Compensation, Terms for Employment; Grant for Warrants).</li>
      </ul>
      <p class="muted">Clause check runs on submit, routing rules fire, and the workflow you just walked through begins.</p>
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
