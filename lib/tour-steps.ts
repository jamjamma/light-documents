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

/**
 * Chapter ids. The tour is split into 6 chapters that can be run individually
 * via the chapter chooser menu, OR walked end-to-end as one flow ("Walk
 * everything"). Each TOUR_STEP carries its `chapter` so the controller can
 * detect chapter boundaries in "chapter" mode and end cleanly.
 */
export type ChapterId =
  | "dashboard"
  | "workflow"
  | "signed"
  | "archive"
  | "templates"
  | "intake";

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
  // Close the DocuSign envelope preview modal. Used when stepping BACK to
  // `preview-envelope` from inside the modal walk, so the popover anchored
  // on the Preview-envelope button isn't trapped behind a still-open modal.
  | "modal:close"
  // Programmatically expand the Envelope-configuration <details> in the
  // preview modal so driver.js highlights the full disclosure, not the
  // collapsed 1-line summary.
  | "modal:expand-config"
  // Scroll the modal's overflow-y-auto container so the anchor-tags bar is
  // visible. driver.js's smoothScroll handles window scrolling but not
  // nested scroll containers.
  | "modal:scroll-anchortags"
  // Expand the Rogue Templates collapsible on /templates so its action
  // buttons (Archive, Notify owner) are visible to highlight.
  | "rogue:expand"
  // Programmatically open the per-row actions menu (the "..." button) on
  // the operator's approval row. Used so the tour shows the actual menu
  // content (Reassign / Re-ping / Reject) instead of just describing it.
  | "approval:open-actions";

export interface TourStep {
  /** Stable id, used for de-dupe in the controller render guard. */
  id: string;
  /** Which chapter this step belongs to. */
  chapter: ChapterId;
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
   * Suppress the Next button. Use when the in-app UI is the only way to
   * advance (e.g. the modal-send step expects the user to click DocuSign's
   * Send button which triggers a navigation; offering a tour-level Next
   * would be confusing).
   */
  hideNext?: boolean;
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
    chapter: "dashboard",
    path: "/",
    title: "Welcome",
    description: `
      <p class="lead">A guided walk through Light Documents, end-to-end.</p>
      <p class="muted">Navigate with <kbd>&rarr;</kbd> / <kbd>&larr;</kbd> or the on-popover buttons. <kbd>Esc</kbd> to exit. Restart anytime via <em>Take the tour</em> in the sidebar.</p>
    `,
    next: "advance",
    nextLabel: "Start",
    hideBack: true,
  },
  {
    id: "kpis",
    chapter: "dashboard",
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
    chapter: "dashboard",
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
    chapter: "dashboard",
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
    chapter: "dashboard",
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
    chapter: "dashboard",
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
    chapter: "dashboard",
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
    chapter: "workflow",
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
    chapter: "workflow",
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
    chapter: "workflow",
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
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-approval-chain",
    side: "top",
    title: "The approval chain",
    description: `
      <p>Three approvers, each routed by a typed rule. We'll walk the actions one at a time.</p>
      <p class="muted">Operator (you) = Martina Holst. The other two represent Slack-DM responders.</p>
    `,
    next: "advance",
  },
  {
    id: "approval-approve",
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-approval-operator-row",
    side: "left",
    title: "Approve your own row",
    description: `
      <p><strong>Click Approve</strong> on the Martina Holst row (your row). The pill flips green and an <strong>Undo</strong> chip appears next to it.</p>
      <p class="muted">This is the only "real" approval; the other rows are simulations of Slack-DM responses.</p>
    `,
    next: "advance",
  },
  {
    id: "approval-undo",
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    // Anchor on the operator's row, not the Undo chip itself. Clicking Undo
    // removes the chip (row returns to pending), which would orphan the
    // popover if it anchored on the disappearing chip. The row stays in DOM
    // through both approved + pending states.
    selector: ".tour-anchor-approval-operator-row",
    side: "left",
    title: "Undo: only before send",
    description: `
      <p>The <strong>Undo</strong> chip next to <em>Approved</em> withdraws your own approval. A new audit row gets appended; the original Approved row stays.</p>
      <p>Try it: click <strong>Undo</strong>, then click <strong>Approve</strong> again to restore the green state before continuing.</p>
      <p class="muted">Undo is refused once the envelope is in DocuSign. That's the line.</p>
    `,
    next: "advance",
  },
  {
    id: "approval-actions-menu",
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-approval-actions-menu",
    side: "left",
    title: "Reassign, Re-ping, Reject",
    description: `
      <p>We just opened the <strong>...</strong> menu on Martina's row for you. Three actions:</p>
      <ul>
        <li><strong>Reassign / Pass on...</strong> Switch the approver (out of office, conflict of interest).</li>
        <li><strong>Re-ping.</strong> Resend the Slack DM if it's been sitting too long.</li>
        <li><strong>Reject...</strong> Block the contract and return it to the owner with a reason.</li>
      </ul>
      <p class="muted">Every action writes a row to the audit trail.</p>
    `,
    next: "advance",
    // Programmatically open the menu so the popover describes what's
    // actually on screen, not what would be on screen if the user clicked.
    effect: "approval:open-actions",
  },
  {
    id: "approval-simulate-others",
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-approval-chain",
    side: "top",
    title: "Approve the rest",
    description: `
      <p>Make sure Martina is green again, then click <strong>Simulate X approves</strong> on the other two rows.</p>
      <p>Each Simulate represents the approver clicking Approve in Slack. Once every row is green, the Send button at the bottom unlocks.</p>
      <p class="muted"><strong>Don't skip rows.</strong> If you click Next with pending approvals, Send stays greyed at the next step and you'll have to come back here.</p>
    `,
    next: "advance",
  },
  {
    id: "preview-envelope",
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-preview-envelope",
    side: "top",
    title: "Open the envelope preview",
    description: `
      <p><strong>Click Preview envelope</strong> below. The DocuSign envelope opens and the tour follows you in.</p>
      <p class="muted"><strong>Send is greyed out?</strong> Approvals are not complete. Close the modal, click <strong>Back</strong>, finish the chain (every row green), then re-open the preview.</p>
    `,
    // Only opening the preview (in-app) or Back advances from this step.
    // The contract page dispatches `tour:auto-next` when the modal mounts.
    hideNext: true,
    // If the user stepped Back into this step from inside the modal walk,
    // the modal is still open and would cover both the Preview button and
    // this popover's anchor. Close it so the highlight is visible.
    effect: "modal:close",
  },

  // ── Act 4: DocuSign preview modal walk ────────────────────────────────
  {
    id: "modal-recipients",
    chapter: "workflow",
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
    chapter: "workflow",
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
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-modal-document",
    side: "left",
    title: "Populated document",
    description: `
      <p>The signed PDF preview. All variables substituted; signature fields auto-placed by anchor tags.</p>
      <ul>
        <li>Page 1: parties, recitals, definitions.</li>
        <li>Mid pages: commercial terms, liability, indemnity.</li>
        <li><strong>Last page: signature blocks</strong> where the anchor tags resolve to actual signing fields.</li>
      </ul>
    `,
    next: "advance",
    effect: "modal:open",
  },
  {
    id: "modal-pagenav",
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-modal-pagenav",
    side: "top",
    title: "Flip to the signature page",
    description: `
      <p><strong>Click the last page number</strong> in the page nav below (or click Next on the nav repeatedly) to jump to the signature page.</p>
      <p class="muted">The tour follows you forward as soon as you reach the last page.</p>
    `,
    // Only paging to the last page (in-app) or Back advances the tour. The
    // modal dispatches `tour:auto-next` when page === totalPages.
    hideNext: true,
    effect: "modal:open",
  },
  {
    id: "modal-anchortags",
    chapter: "workflow",
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
    chapter: "workflow",
    path: `/contracts/${HERO_CONTRACT_ID}`,
    selector: ".tour-anchor-modal-send",
    side: "left",
    title: "Send via DocuSign",
    description: `
      <p>Click <strong>Send via DocuSign</strong> below. The envelope fires, the contract advances to signed, and the page redirects to the signed record. The tour will follow you there.</p>
      <p class="muted"><strong>Send still disabled?</strong> Approvals are incomplete. Click <strong>Back</strong> (or close this modal) and finish the approval chain (every row green). Then re-open the preview.</p>
    `,
    next: "advance",
    effect: "modal:open",
    // Only Send (in-app) or Back advances the tour from this step. A
    // separate tour Next button is confusing here.
    hideNext: true,
  },

  // ── Act 5: Bolt's signed page ─────────────────────────────────────────
  {
    id: "signed-banner",
    chapter: "signed",
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
    chapter: "signed",
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
    id: "audit-trail-intro",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail",
    side: "left",
    title: "Audit trail",
    description: `
      <p>Append-only event log of every state transition this contract went through. The next steps walk each row type one at a time.</p>
      <p class="muted">7-year retention, WORM compliant for finance regulators.</p>
    `,
    next: "advance",
  },
  {
    id: "audit-created",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail [data-event-kind='created']",
    side: "right",
    title: "1. Created",
    description: `
      <p>Contract drafted from a template + source record.</p>
      <p class="muted">Captures who created it and which version of the template was pinned (so future template edits don't disrupt this in-flight contract).</p>
    `,
    next: "advance",
  },
  {
    id: "audit-clause-check",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail [data-event-kind='clause-check']",
    side: "right",
    title: "2. Clause check",
    description: `
      <p>Automated rules engine compared the populated terms against the master template.</p>
      <p class="muted">Recorded with deviation count and which rules fired (Net 60, unlimited liability, customer-only indemnity).</p>
    `,
    next: "advance",
  },
  {
    id: "audit-routed",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail [data-event-kind='routed']",
    side: "right",
    title: "3. Routed for approval",
    description: `
      <p>Routing engine computed who must approve, based on the contract fields and clause deviations.</p>
      <p class="muted">Each approver row records the rule that fired (e.g. ARR &gt; 100k routes CFO).</p>
    `,
    next: "advance",
  },
  {
    id: "audit-notification",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail [data-event-kind='notification']",
    side: "right",
    title: "4. Slack DM sent",
    description: `
      <p>Each approver got a Slack DM in their channel with the contract link and a one-click Approve action.</p>
      <p class="muted">Recorded per approver with name + role. In production, Slack thread replies are mirrored back here too.</p>
    `,
    next: "advance",
  },
  {
    id: "audit-approved",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail [data-event-kind='approved']",
    side: "right",
    title: "5. Approved",
    description: `
      <p>A specific approver clicked Approve.</p>
      <p class="muted">Records the person, role, decided-at timestamp. If the operator clicks Undo before send, a separate <em>withdrew</em> row is appended; the original Approved row stays. Append-only forever.</p>
    `,
    next: "advance",
  },
  {
    id: "audit-sent",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail [data-event-kind='sent']",
    side: "right",
    title: "6. Envelope sent",
    description: `
      <p>DocuSign API returned <code>201 Created</code> with an <code>envelopeId</code>.</p>
      <p class="muted">From this row on, Undo is refused because the envelope is live with signers.</p>
    `,
    next: "advance",
  },
  {
    id: "audit-completed",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail [data-event-kind='completed']",
    side: "right",
    title: "7. Envelope completed",
    description: `
      <p>DocuSign Connect webhook fired with all signers complete.</p>
      <p class="muted">This is the event that triggers the structured writeback (ledger / HRIS / cap table) on the right.</p>
    `,
    next: "advance",
  },
  {
    id: "audit-filed",
    chapter: "signed",
    path: `/contracts/${HERO_CONTRACT_ID}/signed`,
    selector: ".tour-anchor-audit-trail [data-event-kind='filed']",
    side: "right",
    title: "8. Filed",
    description: `
      <p>PDF + DocuSign Certificate of Completion stored to Drive/SharePoint plus S3 WORM cold storage.</p>
      <p class="muted">Records storage location and retention period. WORM (write-once-read-many) is the compliance primitive for finance regulators.</p>
    `,
    next: "advance",
  },
  {
    id: "structured-writeback",
    chapter: "signed",
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
    id: "archive-landing",
    chapter: "archive",
    path: "/archive",
    selector: ".tour-anchor-sidebar-archive",
    side: "right",
    title: "We're in Signed contracts now",
    description: `
      <p>This is the <strong>Signed contracts</strong> section of the sidebar, now highlighted because we navigated here from Bolt's signed record.</p>
      <p class="muted">Every filed contract from every template type lands here. The dashboard above is in-flight work; this is the past record.</p>
    `,
    next: "advance",
  },
  {
    id: "archive-overview",
    chapter: "archive",
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
    chapter: "archive",
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
    chapter: "archive",
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
    chapter: "archive",
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
    id: "templates-landing",
    chapter: "templates",
    path: "/templates",
    selector: ".tour-anchor-sidebar-templates",
    side: "right",
    title: "We're in Templates now",
    description: `
      <p>This is the <strong>Templates</strong> section of the sidebar, now highlighted because we navigated here.</p>
      <p class="muted">Master Word docs live here, alongside the rogue-template governance panel.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-overview",
    chapter: "templates",
    path: "/templates",
    title: "Templates catalog",
    description: `
      <p>8 master Word docs (Drive or SharePoint), grouped into three categories:</p>
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
    chapter: "templates",
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
    chapter: "templates",
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
    chapter: "templates",
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
    chapter: "templates",
    path: "/templates",
    selector: ".tour-anchor-counsel-section",
    side: "bottom",
    title: "Counsel keeps Word for authoring",
    description: `
      <p>This panel explains how Word documents connect. Master templates stay as <code>.docx</code> in <strong>Google Drive or SharePoint</strong>, edited where Counsel already edits. A folder-watch webhook fires on every save; our platform parses the docx, extracts <code>{{variables}}</code> and <code>\\sig:anchor\\</code> tags, and caches.</p>
      <p class="muted">The Legal team (illustrated in this demo by Sara Friis) may still log in to approve a clause deviation when one is routed to them. What stays out is authoring, not review.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-rogue",
    chapter: "templates",
    path: "/templates",
    // Anchor on the header (not the whole panel wrapper) so the highlight
    // is focused on the title + count + scan cadence, not a vague box that
    // includes the not-yet-rendered list.
    selector: ".tour-anchor-rogue-header",
    side: "top",
    title: "Rogue templates governance",
    description: `
      <p>Daily scan flags docs outside <code>/Master Templates/</code> that look like masters but aren't.</p>
      <p>Each flagged file is one signed contract away from quoting the wrong liability cap or payment terms.</p>
      <p class="muted"><em>Phase-2 governance demo. Audit log preserves every decision.</em></p>
    `,
    next: "advance",
  },
  {
    id: "templates-rogue-expand",
    chapter: "templates",
    path: "/templates",
    // Anchor on the chevron icon (top-right of the panel header) so the
    // popover sits next to the actual click target rather than floating
    // off the side of the full-width header button.
    selector: ".tour-anchor-rogue-chevron",
    side: "bottom",
    title: "Open the panel",
    description: `
      <p><strong>Click the chevron</strong> (or anywhere on the panel header) to expand the list of flagged files.</p>
      <p class="muted">The tour follows you forward as soon as you open it.</p>
    `,
    // Only the in-app open advances. Page dispatches `tour:auto-next` when
    // the collapsible flips from closed to open.
    hideNext: true,
  },
  {
    id: "templates-rogue-row",
    chapter: "templates",
    path: "/templates",
    selector: ".tour-anchor-rogue-actions",
    side: "left",
    title: "What you see per file",
    description: `
      <p>Each flagged file shows:</p>
      <ul>
        <li><strong>Match %</strong> vs the closest master template.</li>
        <li><strong>What's off</strong> (the diff summary).</li>
        <li><strong>Last user</strong> and when, so notifications route to the right person.</li>
        <li><strong>Recommended action</strong>: archive, block, or notify, based on context.</li>
      </ul>
    `,
    next: "advance",
  },
  {
    id: "templates-rogue-archive",
    chapter: "templates",
    path: "/templates",
    selector: ".tour-anchor-rogue-actions",
    side: "left",
    title: "Archive (try it)",
    description: `
      <p><strong>Click Archive</strong> on the first flagged file. The row dims, gets an <em>archived</em> badge, and an <strong>Archived by Martina · {timestamp} · Undo</strong> stamp appears.</p>
      <p class="muted">The file stays in Drive. We just record the decision so any future use surfaces it. The tour follows you forward as soon as you click Archive.</p>
    `,
    // In-app Archive click is the only forward path. Page dispatches
    // `tour:auto-next` when `action.archived` is set on the first row.
    hideNext: true,
  },
  {
    id: "templates-rogue-undo-archive",
    chapter: "templates",
    path: "/templates",
    // Anchor on the Undo button itself, not the whole archived stamp,
    // so the popover arrow points at the actual control.
    selector: ".tour-anchor-rogue-undo",
    side: "bottom",
    title: "Undo the archive",
    description: `
      <p>The archived stamp carries an <strong>Undo</strong> link. Click it now if you want to restore the row to rogue status; the audit log keeps both decisions.</p>
      <p class="muted">Every state change is append-only. Even Undo writes a new row; the original Archived row stays.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-rogue-notify",
    chapter: "templates",
    path: "/templates",
    selector: ".tour-anchor-rogue-actions",
    side: "left",
    title: "Notify the owner",
    description: `
      <p><strong>Click Notify owner</strong> on the first flagged file (right side of the row) to open the Slack DM preview.</p>
      <p class="muted">The recipient is auto-routed: last editor when known, team channel when they left the company.</p>
    `,
    // The in-app Notify click is the only forward path. Page dispatches
    // `tour:auto-next` when SlackDmPreview mounts for the first row.
    hideNext: true,
  },
  {
    id: "templates-rogue-slack-preview",
    chapter: "templates",
    path: "/templates",
    selector: ".tour-anchor-rogue-slack-preview",
    side: "top",
    title: "What gets sent",
    description: `
      <p>The Slack message previewed before send: file name, % match, the diff, the recommended action, and the recipient's rationale.</p>
      <p>Click <strong>Cancel</strong> to back out without sending, or <strong>Send DM / Send post</strong> to dispatch. Either way the tour continues on Next.</p>
      <p class="muted">In production we post via the Slack Web API with interactive Acknowledge / Reroute / Snooze buttons; replies thread back into the audit log.</p>
    `,
    next: "advance",
  },
  {
    id: "templates-to-intake",
    chapter: "templates",
    path: "/templates",
    selector: ".tour-anchor-new-contract",
    side: "right",
    title: "Onward: new contract",
    description: `
      <p><strong>Click New contract</strong> in the sidebar to start the intake walk.</p>
      <p class="muted">The tour follows you to the intake form. (You can also exit here, this is the last templates step.)</p>
    `,
    // In-app sidebar click navigates to /contracts/new; controller's future-
    // step matcher then renders intake-stepper. No tour-level Next needed.
    hideNext: true,
  },

  // ── Act 7: New contract intake (end-to-end) ───────────────────────────
  {
    id: "intake-stepper",
    chapter: "intake",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-steps",
    side: "bottom",
    title: "Create a new contract",
    description: `
      <p>3 steps, tracked by the progress bar above. We'll walk all three.</p>
      <ul>
        <li><strong>1. Template.</strong> Master Word doc.</li>
        <li><strong>2. Source record.</strong> CRM / HRIS / manual entry.</li>
        <li><strong>3. Confirm.</strong> Pre-filled fields + clause check on submit.</li>
      </ul>
    `,
    next: "advance",
  },
  {
    id: "intake-template",
    chapter: "intake",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-template-picker",
    side: "top",
    title: "Step 1 · Pick a template",
    description: `
      <p>8 master templates synced from Drive or SharePoint. Each card shows version, jurisdictions, clause rules, and anchor-tag count.</p>
      <p class="muted"><strong>Click any template card below.</strong> The form auto-progresses to step 2 and the tour follows you.</p>
    `,
    // In-app template click is the only forward path; page dispatches
    // `tour:auto-next` when `template` is set. Back is hidden because the
    // previous step (templates-to-intake) lives on /templates, and going
    // back across the navigation boundary leaves no usable anchor here.
    hideNext: true,
    hideBack: true,
  },
  {
    id: "intake-record",
    chapter: "intake",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-record-picker",
    side: "top",
    title: "Step 2 · Pick a source record",
    description: `
      <p>Records pulled from <strong>Salesforce</strong>, <strong>HubSpot</strong>, or <strong>Personio</strong> per template type. Manual entry available for off-CRM records.</p>
      <p class="muted"><strong>Click any record below.</strong> Variables (counterparty, value, terms, signer) auto-prefill from it. The form auto-progresses to step 3 and the tour follows.</p>
    `,
    // In-app record click is the only forward path; page dispatches
    // `tour:auto-next` when `source` is set. Back is hidden: the previous
    // step's anchor (.tour-anchor-intake-template-picker) is unmounted
    // once the form auto-progresses to step 2.
    hideNext: true,
    hideBack: true,
  },
  {
    id: "intake-form",
    chapter: "intake",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-form",
    side: "top",
    title: "Step 3 · Confirm details",
    description: `
      <p>Pre-filled from the source record. Non-standard values flag inline.</p>
      <p class="muted">For full legal markup, download to Word with Track Changes and upload back; AI diffs vs the master.</p>
    `,
    next: "advance",
  },
  {
    id: "intake-runchecks",
    chapter: "intake",
    path: "/contracts/new",
    selector: ".tour-anchor-intake-runchecks",
    side: "top",
    title: "Run checks · create the contract",
    description: `
      <p><strong>Click Run checks.</strong> The contract record is created, the deterministic rules engine runs against the master template, and you land on the new contract's detail page.</p>
      <p class="muted">In production, Claude also runs against the populated document for natural-language clause comparison. Both write into the same <code>ClauseCheckResult</code> shape.</p>
    `,
    next: "advance",
    hideNext: true,
  },
  {
    id: "intake-after-submit",
    chapter: "intake",
    path: "*",
    title: "Contract created",
    description: `
      <p>The new contract's detail page. Clause results are already on screen (the rules engine ran on submit).</p>
      <p>From here, the rest of the flow is identical to what you saw in the <strong>Workflow walk</strong> chapter: routing rules fire, approvers are notified, you preview the envelope, click Send via DocuSign, the contract advances to signed, and structured writeback flows back to Light's systems of record.</p>
      <p class="muted">If you want to walk the post-creation flow now, finish this chapter and pick <em>Workflow walk</em> from the tour menu.</p>
    `,
    next: "advance",
    nextLabel: "Finish",
  },

  // ── Wrap up ───────────────────────────────────────────────────────────
  {
    id: "done",
    chapter: "intake",
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
export const TOUR_CHAPTERS_DONE_KEY = "tour-chapters-done";
export const TOUR_CHAPTER_PROGRESS_KEY = "tour-chapter-progress";

/**
 * The active tour state.
 *
 * - `mode: "all"` walks all 33 steps end-to-end (one big tour).
 * - `mode: "chapter"` walks only the steps in `chapter`. The controller stops
 *   cleanly when the next step would belong to a different chapter.
 *
 * When `mode === "chapter"`, `chapter` MUST be set.
 */
export interface TourState {
  active: boolean;
  stepIndex: number;
  mode: "all" | "chapter";
  chapter?: ChapterId;
}

const DEFAULT_TOUR_STATE: TourState = { active: false, stepIndex: 0, mode: "all" };

export function readTourState(): TourState {
  if (typeof window === "undefined") return DEFAULT_TOUR_STATE;
  try {
    const raw = window.localStorage.getItem(TOUR_STATE_KEY);
    if (!raw) return DEFAULT_TOUR_STATE;
    const parsed = JSON.parse(raw) as Partial<TourState>;
    return {
      active: Boolean(parsed.active),
      stepIndex: typeof parsed.stepIndex === "number" ? parsed.stepIndex : 0,
      mode: parsed.mode === "chapter" ? "chapter" : "all",
      chapter: typeof parsed.chapter === "string" ? (parsed.chapter as ChapterId) : undefined,
    };
  } catch {
    return DEFAULT_TOUR_STATE;
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

// ── Chapter progress + completion tracking ───────────────────────────────

/** Record of completed chapters. Survives Reset Tour but not Reset Demo. */
export function readChaptersDone(): ChapterId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TOUR_CHAPTERS_DONE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChapterId[]) : [];
  } catch {
    return [];
  }
}

export function markChapterDone(chapter: ChapterId): void {
  if (typeof window === "undefined") return;
  try {
    const set = new Set(readChaptersDone());
    set.add(chapter);
    window.localStorage.setItem(TOUR_CHAPTERS_DONE_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

/** Map of chapter → step index of last viewed step, for Resume. */
export function readChapterProgress(): Partial<Record<ChapterId, number>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TOUR_CHAPTER_PROGRESS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed;
    return {};
  } catch {
    return {};
  }
}

export function writeChapterProgress(chapter: ChapterId, stepIndex: number): void {
  if (typeof window === "undefined") return;
  try {
    const prog = readChapterProgress();
    prog[chapter] = stepIndex;
    window.localStorage.setItem(TOUR_CHAPTER_PROGRESS_KEY, JSON.stringify(prog));
  } catch {
    // ignore
  }
}

export function clearChapterProgress(chapter: ChapterId): void {
  if (typeof window === "undefined") return;
  try {
    const prog = readChapterProgress();
    delete prog[chapter];
    window.localStorage.setItem(TOUR_CHAPTER_PROGRESS_KEY, JSON.stringify(prog));
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
    window.localStorage.removeItem(TOUR_CHAPTERS_DONE_KEY);
    window.localStorage.removeItem(TOUR_CHAPTER_PROGRESS_KEY);
  } catch {
    // ignore
  }
}

// ── Chapter metadata ──────────────────────────────────────────────────────

export interface ChapterMeta {
  id: ChapterId;
  title: string;
  blurb: string;
  /** Approximate duration in seconds; informational only. */
  estSeconds: number;
}

export const CHAPTERS: ChapterMeta[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    blurb: "Operator KPIs, stage filters, sidebar.",
    estSeconds: 45,
  },
  {
    id: "workflow",
    title: "Workflow walk",
    blurb: "Bolt MSA from in-review to sent. Clause check, routing, approvals with Undo and ... menu, envelope preview, send.",
    estSeconds: 150,
  },
  {
    id: "signed",
    title: "Signed record",
    blurb: "Signed banner, PDF retention, audit trail walked event by event, structured writeback.",
    estSeconds: 120,
  },
  {
    id: "archive",
    title: "Signed archive",
    blurb: "All filed contracts, by category.",
    estSeconds: 30,
  },
  {
    id: "templates",
    title: "Templates",
    blurb: "8 master Word docs (Drive or SharePoint), rogue-template governance walked action by action, Counsel's editing workflow.",
    estSeconds: 90,
  },
  {
    id: "intake",
    title: "New contract",
    blurb: "End-to-end: pick template, pick record, confirm fields, run checks, land on the new contract.",
    estSeconds: 75,
  },
];

/** Total estimated duration across all chapters, in seconds. */
export const TOTAL_TOUR_SECONDS = CHAPTERS.reduce((s, c) => s + c.estSeconds, 0);

/** Total estimated duration formatted as "~N minutes" (rounded). */
export function formatTotalTourDuration(): string {
  const minutes = Math.max(1, Math.round(TOTAL_TOUR_SECONDS / 60));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

/** First TOUR_STEPS index that belongs to a given chapter. */
export function firstStepIndexOf(chapter: ChapterId): number {
  const idx = TOUR_STEPS.findIndex((s) => s.chapter === chapter);
  return idx === -1 ? 0 : idx;
}

/** Total step count in a chapter. */
export function chapterLength(chapter: ChapterId): number {
  return TOUR_STEPS.filter((s) => s.chapter === chapter).length;
}

/** Step index within the chapter (1-based for display). */
export function stepIndexWithinChapter(
  chapter: ChapterId,
  globalStepIndex: number,
): number {
  const first = firstStepIndexOf(chapter);
  return Math.max(0, globalStepIndex - first);
}

/**
 * Section-by-section progress label for the popover. Renders as e.g.
 * "Workflow · 5 of 12" instead of "12 of 60", so the operator sees how far
 * into the current chapter they are rather than facing the full 60-step
 * total. Used by TourController.progressText.
 */
export function chapterProgressLabel(globalStepIndex: number): string {
  const step = TOUR_STEPS[globalStepIndex];
  if (!step) return "";
  const meta = CHAPTERS.find((c) => c.id === step.chapter);
  const local = stepIndexWithinChapter(step.chapter, globalStepIndex) + 1;
  const total = chapterLength(step.chapter);
  const label = meta?.title ?? step.chapter;
  return `${label} · ${local} of ${total}`;
}
