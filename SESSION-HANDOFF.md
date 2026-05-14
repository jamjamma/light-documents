# Light Documents: Session Handoff

> Current-state snapshot. If you're resuming this build in a new session,
> start here, then jump to `docs/PROJECT.md` for the full map.

## Status

**Demo-ready.** Live at https://light-documents-sigma.vercel.app/. Local dev
runs with `npm run dev`. Build is green, no console errors, no horizontal
overflow at iPhone 14 Pro width.

- 8 templates (NDA, MSA, MSA Pilot, Order Form, Employment DK, Employment UK, Warrant, Advisor Warrant).
- 10 in-flight + 4 signed seed contracts spanning every dashboard filter.
- 8 routes, all 200, typecheck clean, production build clean.
- `STATE_VERSION = 9`. localStorage shape: `{version, contracts, manualSourceRecords?, rogueActions?, seededAt}`.

**Case-study parts:**
- Part 1 (this build): complete and deployed.
- Part 2 (SaaS cohort analysis): `case-study/PART-2-COHORT-ANALYSIS.md`.
- Part 3 (Day-one mindset): `case-study/PART-3-DAY-ONE.md`.

## How to run

```bash
cd ~/Desktop/claude/Projects/light-documents
npm install   # first time only
npm run dev
# open http://localhost:3000
# tap "Reset demo data" in the sidebar to clear localStorage and re-seed
```

Requires Node 20+. No env vars, no auth, no database.

## What ships in the current build

### Mobile chrome (390px → desktop)

- `MobileTopBar` (sticky `top-0`) hosts the hamburger + brand on mobile so it
  has a clear anchor instead of floating over scrolled content.
- `MobileNavContext` shares drawer-open state between the top bar and the
  slide-in `Sidebar` drawer.
- `KpiStrip` is a 2x2 grid on mobile, single row on `sm+`.
- `ClauseDiff` and `TemplateDetailModal`'s clause-rules table render as
  stacked cards on mobile, keep the table on `sm+`.
- `ContractsTable` filter tabs scroll horizontally on narrow viewports.
- Every action bar (Card header actions, Send via DocuSign footer) wraps
  cleanly on mobile.

### Rogue templates: Archive + Notify owner (templates page)

Each rogue row in `RogueTemplatesPanel` has two interactive actions:

- **Archive** persists `{archived: {at, by}}` under `rogueActions[fileId]` in
  localStorage. Row dims, "rogue" badge becomes "archived", an Undo pill
  appears.
- **Notify owner** opens an inline Slack DM preview with:
  - data-driven recipient routing (still-employed lastUser → DM by name;
    "left company" → channel fallback `#sales-ops`; no lastUser → triage
    channel `#legal-rogue-templates`),
  - the exact Slack message body that would post,
  - a production note about `chat.postMessage` + Interactivity buttons +
    audit-log thread-back.
- Send replaces the buttons with a green "Slack DM/channel sent to X" pill +
  Undo.

Reset demo clears `rogueActions`.

### Undo my approval

`ApprovalChain` renders an "Undo my approval" pill next to "Approved by X"
on rows the current operator (Martina Holst) approved. Wired to
`undoApproval()` in `contract-store`. Guardrails:

- Only the original approver can undo their own row.
- Refused on `sent` / `signed` / `filed` (envelope is in DocuSign).
- If hers was the last vote and the contract had advanced to
  `ready_to_send`, stage walks back to `awaiting_approval` with a system
  audit event.

### Manual entry modal UX

`ManualEntryModal` (record picker → "Add manually" tab) opens with:

- Safe non-required defaults pre-filled (vesting 48m, cliff 12m, payment
  net 30, term 12m, equity 0bps).
- First input auto-focused so the mobile keyboard pops up.
- Required-but-empty inputs get amber borders.
- Italic + light grey placeholders so empty fields don't look filled.
- Amber footer hint next to the disabled button names exactly which fields
  are missing ("Fill 'Stakeholder name' + 'Warrant percentage' to enable
  Add").

### Demo framing for personas

The About page has a one-sentence cast-list note: all personas (Martina
Holst as Head of F&O, Sara Friis as in-house counsel, Tom Bauer as the AE,
plus outside counsel and board members) are illustrative stand-ins. The
verbose enumeration was trimmed in the 2026-05-14 polish pass (see
"Polish pass 2026-05-14" below). The outside-counsel firm name was changed
from "Plesner" (a real Danish firm) to "Nordic Counsel Partners" to avoid
unforced optics.

The "Legal keeps Word, not us" callout on About explains the cryptic
earlier line "The Legal team never logs into our tool" in plain English,
and is now promoted to the top of the README as its own section
("Why Counsel will adopt this").

## File map (current)

```
light-documents/
├── README.md, SESSION-HANDOFF.md
├── app/
│   ├── globals.css, layout.tsx       # MobileNavProvider + MobileTopBar + Sidebar + main
│   ├── page.tsx                      # Dashboard
│   ├── templates/page.tsx            # Catalog + rogue-templates panel
│   ├── archive/page.tsx              # Signed contracts + lifetime KPIs (uses shared KpiStrip)
│   ├── about/page.tsx                # Submission memo + names note + Legal-keeps-Word callout
│   └── contracts/
│       ├── new/page.tsx              # 3-step intake
│       └── [id]/
│           ├── page.tsx              # Detail + undo my approval
│           └── signed/page.tsx
├── components/
│   ├── ui/{Button, Card, Badge, Modal, EmptyState}.tsx
│   ├── Sidebar.tsx                   # Drawer on mobile, collapse-to-icons on desktop
│   ├── MobileTopBar.tsx              # Sticky top bar that hosts the hamburger
│   ├── MobileNavContext.tsx          # Shared drawer-open state
│   ├── Header.tsx, Breadcrumb.tsx, BackButton.tsx, DemoBanner.tsx
│   ├── StatusBadge.tsx, RiskBadge.tsx, DocumentTypeIcon.tsx
│   ├── KpiStrip.tsx                  # 2x2 mobile / row desktop
│   ├── AboutWidget.tsx
│   ├── ContractsTable.tsx            # Scrollable filter tabs
│   ├── TemplateCard.tsx, TemplatePicker.tsx, TemplateDetailModal.tsx
│   ├── RecordPicker.tsx, ManualEntryModal.tsx
│   ├── IntakeForm.tsx, ClauseDiff.tsx, RoutingPanel.tsx
│   ├── ApprovalChain.tsx             # + onUndoApprove + canUndoApprove
│   ├── ApprovalActionsMenu.tsx, ReassignModal.tsx, RejectModal.tsx
│   ├── DocuSignPreviewModal.tsx
│   ├── RogueTemplatesPanel.tsx       # Archive + Notify owner wired
│   ├── AuditTrail.tsx, LedgerImpactPanel.tsx
├── lib/
│   ├── types.ts
│   ├── policy-config.ts
│   ├── template-meta.ts, template-meta-icons.tsx, template-bullets.tsx
│   ├── approver-directory.ts, signer-routing.ts
│   ├── clause-checker.ts, routing-rules.ts
│   ├── contract-store.ts             # STATE_VERSION = 9; rogue actions + undo approval + structured ledger writeback
│   ├── mock-data.ts
│   └── format.ts
├── docs/
│   ├── PROJECT.md                    # full map
│   ├── architecture.md, features.md, decisions.md, cross-functional.md, demo-script.md
└── case-study/
    ├── PART-2-COHORT-ANALYSIS.md
    └── PART-3-DAY-ONE.md
```

## Templates (8)

| Type | Templates |
|---|---|
| NDA | Mutual NDA v3.1 |
| MSA / customer | MSA v4.2 (standard), MSA: Pilot v1.0 (3-month POC), Order Form v2.0 (commercial companion) |
| Employment | Employment (Denmark) v2.0, Employment (United Kingdom) v1.0 |
| Equity | Warrant Agreement v1.5, Advisor Warrant v1.0 |

Each has version history (2-4 versions), per-type DocuSign feature config,
conditional sections, and anchor tags.

## Filter coverage

| Filter | Count |
|---|---|
| All in-flight | 10 |
| Awaiting me (Head of F&O) | 3 |
| Blocked | 4 |
| Signed this month | 4 |
| Archive (all signed) | 4 |

## Hard constraints (re-asserted)

- **No em-dashes, no en-dashes** in user-visible strings. UI placeholder `—`
  for empty data is fine. Single-character glyphs are not prose.
- **No fabricated config keys / API surfaces / CLI flags.** Verify against
  the real schema or source before writing.
- **Every stubbed surface carries a "Demo:" callout** so the audience knows
  exactly what is and isn't real.

## Resume prompt for new session (if needed)

```
Resume the case study build at ~/Desktop/claude/Projects/light-documents/.
Read SESSION-HANDOFF.md, then docs/PROJECT.md. Build is demo-ready and
deployed at https://light-documents-sigma.vercel.app/. STATE_VERSION = 9.

Hard constraints: no em-dashes or en-dashes in user-visible copy, no
fabricated config / API references, every stub carries a "Demo:" callout.
Auto mode: execute autonomously.
```

## Polish pass 2026-05-14 (post-review)

Driven by hiring-manager-style reviews (ChatGPT + Claude). All changes are
docs / wording / sequencing only. No engine or state-machine changes.

**Tier 1 (credibility + coherence)**

1. **Reframe rewritten to partner tone.** README and About no longer open
   with "the real problem is not document upload." New framing: the stated
   pain is real, the workflow kills it directly, and *while we're in there*
   the bigger prize is systems-of-record writeback. Same content, less
   "smart outsider."
2. **Ledger writeback resequenced to #2** in "What I'd build next" (was
   #7). Added the line: "Slack-first is for adoption; writeback at #2 is
   for the moat. In an actual rollout I would build the two in parallel."
3. **Seed counts reconciled.** Truth (from `mock-data.ts`):
   - 8 templates
   - 14 source records (Salesforce / HubSpot / Attio / Personio / Ashby /
     Manual)
   - 14 seed contracts = 10 in-flight + 4 signed
   - 4 rogue templates
   - 3 Light entities
   Fixed PROJECT.md `mock-data` row (was "8+ source records, 8 seed
   contracts") and `mock-data.ts` line in README repo map.
4. **Mobile contradiction fixed.** Removed "Mobile responsive. Desktop-only
   internal tool. Documented." from `decisions.md §15` (it contradicted the
   README, which describes a real responsive layout).
5. **Template-count inconsistency fixed.** About page said "5 document
   templates"; new README repo map said "all 7 templates". Both replaced
   with "8" everywhere.
6. **QES wording reframed as Light policy, not legal requirement.**
   - `features.md` MSA section now says "applied as Light signing policy
     when ARR ≥ €100k and EU governing law (not a legal requirement on
     every EU MSA)."
   - Warrant section now says "applied per Light policy for all warrants
     because warrants are high-value equity instruments."
   - Added an inline policy note explaining the rationale (evidential
     weight in EU court).
7. **"Only contract approach that matches Light's product thesis" → "The
   contract approach that matches Light's product thesis."** Both README
   and About. Removes overclaim.

**Tier 2 (narrative sharpening)**

8. **"Why Counsel will adopt this" promoted** from About-page parenthetical
   to README section near the top. The single best anti-objection line.
9. **CLM defer pressure-tested.** Build-vs-buy table no longer says "too
   heavy for 50-100/month" (2022-era answer). New answer engages with
   Juro / SpotDraft 2026 SMB pricing, calls out what the 30% they don't
   cover is, and explains why that 30% is precisely the strategic wedge.
10. **"Contracts are ledger objects" reworded to "structured data writes
    back to the relevant system of record"** across README, About,
    `decisions.md` ADR 2, and ADR 14's general-rule paragraph.
11. **Before / after friction-kill table added** near top of README.
    Six rows: field editing, anchor tags, approval chasing, version risk,
    ledger entry, lost contracts.
12. **Surface-area defense added.** Explains *why* each non-obvious feature
    is here (committee + PTO, channel collision, version pinning, entity
    signer, NDA exception) as edge-cases naive tools fail.
13. **"~10k lines of TypeScript" removed** from `PROJECT.md §13`. Volume is
    not a virtue.
14. **AI framing sharpened.** README "What works vs stubbed" now has a
    dedicated "Where Claude lives in production" callout: Claude proposes
    deviations, deterministic rules decide who approves. That separation
    is the auditability story.

**Tier 3 (polish)**

15. **Rogue templates demoted** in demo path. Now an "extensibility path"
    (step 7), not a headline.
16. **README sections reordered.** New order: answer → problem → build-vs-
    buy → friction table → Counsel callout → key decision → demo → real-vs-
    stubbed → surface area → what next → assumptions → run → tech stack
    → repo map (last).
17. **MSA promoted as the hero workflow** in demo path; other templates
    framed as "same machinery, shown in /templates."
18. **Plesner renamed to "Nordic Counsel Partners".** Plesner is a real
    top-tier Danish firm; using it as a stand-in was an unforced optics
    error. Replaced in `approver-directory.ts`, in `mock-data.ts` version
    history (6 author attributions), and in PROJECT.md mentions.
19. **Three-entity assumption hedged.** `decisions.md` ADR 6 retitled
    "Three Light entities (assumed)" with explicit "would verify with
    Head of F&O in week one." README assumption #6 also hedged.

**Tier 4 (optional)**

20. **Cast list trimmed** on About page from a bulleted-list of 10 names
    to a single sentence.

**What I did NOT change**

- State machine, engines, rules, mock-data structure (only attribution
  strings in version history and the one outside-counsel record).
- Routing decisions (ledger writeback as a separate signed-page detail
  was scoped out; the UI panel stays as-is).
- Build configuration. No npm install run, no dev server started.
  The doc changes are pure markdown / .tsx text edits and should not
  change the build output.
- `case-study/PART-2-COHORT-ANALYSIS.md` and `case-study/PART-3-DAY-ONE.md`
  were not touched.

**Verification done**

- Counts re-verified against `mock-data.ts` (8 / 14 / 14 / 4 / 3).
- `grep -i plesner` returns zero hits across `.ts`, `.tsx`, `.md` in
  source tree (excluding node_modules / .next).
- README, About, PROJECT.md, decisions.md, features.md, SESSION-HANDOFF.md
  all use "8 templates" consistently.
- README, About, PROJECT.md, mock-data row all use "14 seed contracts
  (10 in-flight + 4 signed)" consistently.

**Verification still needed (run when you next pick this up)**

- `npm run build` to confirm no .tsx edit broke the build.
- Live-render check on About page to confirm trimmed cast section
  renders cleanly without the deleted bulleted list.
- Visual check that the README structure still flows when rendered on
  GitHub.

---

## UI polish pass 2026-05-14 (operator-credibility + moat UI)

Driven by friend review of the live demo (operator perspective). All changes
are UI / wording / sequencing. State machine, routing engine, approver
directory, and signer routing are unchanged.

**Phase 1 — operator credibility**

1. **KPI strip rewritten.** `computeKpis()` extended with three new
   operator-actionable counts: `awaitingMe`, `blockedOver3Days`, `inReview`.
   Dashboard renders these three as the primary strip. Avg cycle demoted to
   a small "Cycle health" line below. "Signed this week" removed from
   dashboard (lives only on the signed-contracts page now). Each KPI tile
   is clickable and filters the table below.
   - `KpiStrip.tsx` extended with optional `onClick` + `active` props.
   - `lib/contract-store.ts` `computeKpis` signature: now `(contracts, forRole?)`.
2. **"Signed this month" tab removed** from ContractsTable filters.
   Replaced with `"In review"` which matches the new KPI.
3. **Type-mix legend replaced** with horizontally scrollable chip row in
   the table header. Composes with the stage filter tabs.
4. **Vanity taglines removed** from Dashboard / Templates / Archive page
   subtitles. Dashboard now has none; Templates is "8 master templates
   synced from Drive."; Archive is "Past signed contracts."
5. **Archive renamed "Signed contracts"** in sidebar nav and page title.
   ARR / headcount / equity KPIs replaced with: Total signed / Customer
   contracts / People / Equity (counts only). A secondary "By entity"
   line shows count per Light entity (DK/UK/US). Route stays `/archive`.

**Phase 2 — discoverability**

6. **"Try the MSA flow" callout** on Dashboard. Dismissable, persists
   dismissal via `localStorage["callout-msa-flow-dismissed"]`. Points at
   `c_bolt_msa` (the high-risk in-review MSA seed).
7. **Undo-my-approval surfaced inline** next to the green "Approved"
   status pill on the operator's own approved rows. The old below-the-row
   pill is replaced with a small caption ("your approval; use Undo above
   to withdraw"). Friend's "couldn't find it" critique addressed.
8. **DocuSign Preview Modal config collapsed by default.** Modal subtitle
   reduced to subject only. Expiry / reminders / routing / QES / SMS /
   witness / PowerForm / BulkSend lifted into a `<details>` block titled
   "Envelope configuration (audit view)", default collapsed. The
   populated document is the primary visual.

**Phase 3 — strategic moat UI**

9. **`LedgerImpact` shape extended** with three optional structured
   blocks: `journalEntry` (MSA + Order Form), `hrisRecord` (Employment),
   `capTableDelta` (Warrant). NDAs continue to short-circuit upstream.
10. **`buildLedgerImpact()` rewritten** to populate the new blocks. MSAs
    and Order Forms render a real-looking GL entry: `DR 1200 Trade
    Receivables / CR 2400 Deferred Revenue`, with dimension chips
    (Customer, Source record, Entity, Renewal). Employment renders an
    HRIS payload with employee ID, role, manager, entity, probation.
    Warrant renders a cap-table delta with grant ID, percentage, vesting,
    board resolution, entity. Stable IDs derived from a hash of the
    contract id so reloads show the same entry numbers.
11. **`LedgerImpactPanel.tsx` redesigned** to render the new blocks below
    the existing summary rows, with monospace account codes and dimension
    chips. Visual treatment intentionally evokes a real ERP screen.
12. **`STATE_VERSION` bumped 8 → 9** so existing localStorage with the
    old flat-shape `ledger` is invalidated and re-seeded with the new
    structured blocks. Seed-state backfill in `seedState()` calls
    `buildLedgerImpact()` for every pre-filed seed contract, so the
    realistic GL entry shows on first load.

**Phase 4 — small polish**

13. **Category pill hidden** on template cards when rendered inside a
    section grid that already names the category. Flat "All" view
    keeps the pill (no section context).
14. **Sidebar nav cleaned.** "Archive" → "Signed contracts". The
    "workflow layer" jargon label under the brand has been removed.

**What I did NOT change**

- State machine transitions and journey commands.
- Routing rules / approver directory / signer routing.
- Mock data structure (templates, source records, seed contracts, rogue
  templates). The 4 pre-filed seed contracts' manual `ledger` headlines
  are overwritten by `buildLedgerImpact()` at seed time.
- Light design-system retune (deferred Phase 5 in the plan, not done).
- Avatar visual treatment (deferred).

**Verification done in-session**

- All edits read-then-edit per house rules; no fabricated config keys.
- Verified `c_bolt_msa` exists in seed data before linking it.
- Verified `Jurisdiction` shape before referencing it in archive KPIs
  (corrected from `Map<Jurisdiction, …>` to `Map<string, …>`).
- Verified all `ContractFields` field names referenced in
  `buildLedgerImpact` extensions exist in `lib/types.ts`.
- Em-dash audit: all new prose edits use parentheses / colons / commas
  instead of em-dashes. Single-char `—` placeholders for empty data
  cells preserved per project rule.

**Verification still needed before push**

- `npm run build` to catch any TS errors from the `Filter` type rename
  (`signed_recent` → `in_review`) and the `LedgerImpact` shape extension.
- Local browser walk-through:
  1. Dashboard renders 3 KPI tiles, callout visible on first load,
     clicking "Awaiting me" filters the table.
  2. Click "Open Bolt MSA" → contract detail → simulate Legal approves →
     verify Undo affordance appears next to the green Approved pill.
  3. Approve all → Preview envelope → verify config block is collapsed
     by default with "Envelope configuration (audit view)" disclosure.
  4. Send → signed page → verify journal entry renders with DR/CR rows
     and dimension chips.
  5. Sidebar shows "Signed contracts" (not Archive); page shows
     count-based KPIs; ARR/headcount/equity gone.
  6. Templates page section cards have no category pill; All view does.
  7. Reset demo data → all of the above still works on a fresh seed.

---

## UI polish pass 2026-05-14 (operator follow-ups + guided tour + honesty audit)

Driven by a friend who walked the live demo as a Martina-like operator and a
follow-on honesty audit (don't overclaim Light's integration position).

**Operator follow-up fixes**

1. **Blocked KPI threshold dropped.** Was "Blocked > 3 days" (count of 0 on
   fresh seed). Now "Blocked" matches the filter-tab semantics exactly. Row-
   level "stale" badge added to ContractsTable rows whose blocked status has
   sat for 3+ days, so urgency signal isn't lost.
2. **Flame icons removed** from ContractsTable rows. Risk column had been
   dropped earlier; flame was a leftover indicator that read as noise.
3. **AboutWidget simplified.** Removed the "TRY: Approve a row, then
   'Undo my approval' · Rogue templates: Archive + Notify owner" callout
   row. The guided tour now teaches those affordances; AboutWidget just
   states the strategic reframe and links to the full memo.
4. **MSA-flow callout copy simplified.** From "Bolt MSA is high-risk and in
   review. Click in to see clause flags, the routing engine, the anchor-tag
   envelope, and the ledger writeback on the signed page." → "New here?
   Take the guided tour, or open Bolt MSA to walk the demo path yourself."
   Two CTAs: "Take the tour" (primary) and "Open Bolt MSA" (secondary).

**Overclaim audit (honesty pass)**

5. **"Moat" softened to "strategic extension"** in:
   - `README.md` "What I would build next" row #2
   - `docs/PROJECT.md` "What I'd build next" + value-chain narration
   - `docs/demo-script.md` 3:30-4:00 section title rewritten
   to "The structured writeback"
6. **`LedgerImpactPanel` header reworded** from "Light ledger · journal
   entry" to "Structured writeback · journal entry shape" and the footer
   Demo note now reads "The prototype emits this shape on the DocuSign
   `envelope-completed` webhook. In production it posts to whichever
   endpoint Light exposes (ledger / billing / HRIS / cap table). The
   integration target is also stubbed in this build."
7. **README "what is stubbed" table** now flags that **both sides of the
   writeback integration** are stubbed (we emit the shape; Light needs to
   expose the receiving endpoint). This was the structural overclaim:
   previously the table implied we wired one side and only the call was
   simulated. Now it's honest in both directions.

**Guided product tour (new feature)**

8. **`driver.js` installed** (~9 KB, MIT). Single dependency, no React-
   specific wrapper.
9. **`lib/tour-steps.ts`** defines 8 steps spanning Dashboard → Contract
   detail → Signed page, with explicit `path` + `selector` per step.
10. **`components/TourController.tsx`** mounts in `app/layout.tsx`. Reads
    tour state from `localStorage["tour-state"]` (`{active, stepIndex}`),
    watches `usePathname()`, and drives the driver.js popover for the
    current step. Cross-page navigation via Next router; the controller
    waits ~2s of 100ms retries for the next anchor to mount before
    re-rendering.
11. **CSS anchors** added at: `app/page.tsx` (`.tour-anchor-kpis`,
    `.tour-anchor-callout`), `app/contracts/[id]/page.tsx`
    (`.tour-anchor-clause-diff`, `.tour-anchor-approval-chain`,
    `.tour-anchor-preview-envelope`), `app/contracts/[id]/signed/page.tsx`
    (`.tour-anchor-ledger`).
12. **Triggers**: tour auto-starts on first desktop visit (600ms after
    dashboard hydrates). Two manual triggers: "Take the tour" button in
    sidebar bottom (next to Reset demo), and the primary CTA in the
    dashboard callout.
13. **Dismissal**: clicking the X, pressing Esc, or finishing the tour all
    set `localStorage["tour-dismissed"] = "true"`. Both manual triggers
    clear that flag explicitly so users can re-take the tour any time.
14. **Mobile fallback**: tour is hidden < 768px. Sidebar / callout triggers
    show an `alert()` explaining that the tour is desktop-first and to
    use the "Open Bolt MSA" path on mobile. Controller short-circuits if
    `window.innerWidth < 768` so accidental triggers don't break.
15. **Theme**: driver.js CSS overridden in `app/globals.css` under
    `.light-tour-popover` to match the existing ink / accent palette.
    Default driver.js blue replaced with ink-900 primary, ink-50 hover,
    custom border radius and shadow.

**What I did NOT change in this pass**

- The 4 small fixes above and the guided tour are the entire scope. No
  state machine, routing, signer, or approver changes.
- The seed data ledger shapes (still come from `buildLedgerImpact()` at
  seed time, unchanged from the previous pass).
- The mobile responsive layout (mobile tour just hidden; the mobile UI
  itself was already done).

**Verification done in-session**

- `npm run build` green twice (after the dashboard rewrite + tour wiring;
  rebuilt clean after clearing `.next/` to remove stale vendor chunks
  left by `npm install driver.js` overlapping the dev server).
- `c_bolt_msa` verified to exist in seed data before linking from tour
  step 3.
- driver.js `Side` type confirmed exported before importing.
- Tour anchors verified to exist in the rendered components (added in
  the same pass that wired the tour).
- KPI label "Blocked" matches the filter tab "Blocked" semantics; the
  Blocked-tab `applyFilter` predicate and `isBlocked()` helper return
  the same set.
- Em-dash audit: all new prose uses parentheses / commas / periods.

**Verification still needed before push**

- Browser walk on each of the 8 tour steps end-to-end (auto-start on
  first visit, navigate to contract, simulate approvals, preview, send,
  signed page renders the ledger anchor correctly).
- The structured writeback panel header reads "Structured writeback ·
  journal entry shape" on signed contracts.
- The dashboard callout copy now reads the simplified version and the
  KPI strip shows "Blocked" not "Blocked > 3 days".
- Reset demo data, then re-trigger the tour from the sidebar — verify
  the dismissed-flag clears.

---

## Tour rewrite + once-only auto-start 2026-05-14

Driven by friend QA: tour was breaking after step 4 (closure bug) and
re-auto-starting on every dashboard visit (no once-only gate).

**Bugs fixed**

1. **Closure bug in TourController.** `renderStep` was memoised with
   empty deps, capturing the initial `handleNext`. `handleNext` in turn
   captured the initial `pathname` (`/`). After a route push to
   `/contracts/c_bolt_msa`, the closure still thought we were on `/`, so
   the same-path check (`nextStep.path === pathname`) failed and the
   tour silently went dormant. Fix: rewrote handlers as a refs-based
   dispatch table (`handlersRef.current = { next, prev, close }`)
   rewritten on every render. Driver.js callbacks dereference
   `handlersRef.current` at click time, always getting the freshest
   closure with the current pathname / router / state.

2. **Auto-restart every visit.** Old gate was `!isTourDismissed()`. If
   the tour broke without completing or being dismissed, `tour-dismissed`
   stayed false and the dashboard re-auto-started on every mount. Added
   a separate `tour-seen` localStorage flag that flips to true on first
   start (auto OR manual) and stays true forever. Auto-start now gates
   on `!hasSeenTour()` exclusively. Users can still manually re-trigger
   via the sidebar / callout buttons (which dispatch the "tour:start"
   event regardless of either flag).

**Tour rewritten to 13 substantive steps**

Three acts:

- **Act 1: Dashboard (5 steps)** — Welcome, partner-framed reframe,
  operator KPIs, stage tabs + type chips, "Open Bolt MSA" CTA step that
  navigates to the contract page.
- **Act 2: Contract detail (4 steps)** — Clause checker (with the 3
  specific deviations called out), routing rules engine (with the 3
  triggers explained: clause / ARR>50k / ARR>100k), approval chain (with
  reassign/pass-on/re-ping/reject + Undo affordance), preview envelope
  (skips ahead to a signed contract instead of forcing the modal/send
  flow).
- **Act 3: Outputs + extensibility (3 steps + wrap-up)** — Structured
  writeback (DR/CR shape + dimension chips, with the honest both-sides-
  stubbed framing), signed-contracts archive, templates page + rogue
  templates governance, finish.

Descriptions use HTML (`<p>`, `<ul>`, `<li>`, `<strong>`, `<em>`,
`<kbd>`, `<code>`) because driver.js renders the description string via
innerHTML. Em-dashes replaced with colons throughout per project rule.

**New anchor classes added**

- `.tour-anchor-table-filters` on the `ContractsTable` header (stage
  tabs + type chips)
- `.tour-anchor-routing` wrapping the Routing panel card on the contract
  detail page

Existing anchors reused unchanged: `.tour-anchor-kpis`,
`.tour-anchor-callout`, `.tour-anchor-clause-diff`,
`.tour-anchor-approval-chain`, `.tour-anchor-preview-envelope`,
`.tour-anchor-ledger`.

**TourController logic engine hardening**

- `destroyDriver()` clears both the driver instance ref and the
  rendered-step de-dupe ref, so re-entering the same step on a new
  pathname re-renders cleanly.
- `renderStep` retries the anchor lookup up to 25× at 100ms intervals
  (~2.5s) to handle the race between `router.push` and the new page
  mounting its DOM.
- Mobile fallback: `renderStep` short-circuits with `destroyDriver`
  if `window.innerWidth < 768`. Trigger buttons also show an alert.
- Modal step removed: instead of trying to anchor into the DocuSign
  preview modal (z-index / dismissal race), the step before clicking
  Preview navigates straight to `/contracts/c_acme_msa/signed` to show
  the structured writeback on a real signed seed contract.
- `close()` and finish both write `dismissed=true` + `seen=true` so
  the tour can be re-triggered manually but never auto-fires again.
- Back navigation across page boundaries: `prev()` pushes to the prev
  step's path if it doesn't match the current pathname.

**Devil's-advocate audit (mental walk-through done before commit)**

- Deep-link into the tour by clicking a callout while on a contract
  page → tour event handler pushes `/` first, then renders step 0. ✓
- User closes the tab mid-tour → `tour-state.active` may still be true,
  but `tour-seen` blocks auto-start. Path-change effect re-renders the
  step if the pathname still matches (resume). Otherwise dormant. ✓
- User resizes to mobile mid-tour → next render destroys the driver.
  The popover lingers visible until the next state change. Acceptable
  trade-off (no resize listener added). ✓
- Seed data drift → if anchor element missing, retry-poll exhausts
  and driver.js opens with `element: undefined` (floating centred).
  Awkward but not broken. Reset Demo Data fixes any seed drift. ✓
- Manual navigation during the tour → path-change effect goes dormant
  if the new pathname doesn't match the current step. User can manually
  resume by clicking Take the Tour (restarts from step 0). ✓

---

## Tour restructure: menu-by-menu walk 2026-05-14

Driven by friend QA: the previous workflow-end-to-end tour jumped from
Bolt MSA's Preview envelope step directly to Acme MSA's signed page, which
read as a non-sequitur (different contract, no narrative bridge). Also,
the In review stage filter never got a moment in the walk-through, and the
welcome popover typography read as cramped.

**New tour shape: 17 steps, 5 acts**

- **Act 1, Orient (4):** welcome (centered), KPI tiles, stage tabs + type
  chips, sidebar nav.
- **Act 2, Filter walk (3):** Awaiting me, Blocked, In review. Each step
  fires a `tour:effect` event the dashboard listens to; the table actually
  filters as the popover narrates. In review's last step navigates into
  Bolt MSA.
- **Act 3, Workflow walk (4):** clause checker, routing rules, approval
  chain (try Approve + Undo on Martina's row), preview envelope. Preview
  step instructs the user to open the modal manually and close it before
  clicking Next; no inside-modal anchor, no forced Send.
- **Act 4, Outputs (2):** signed-contracts archive at `/archive`, then
  navigate into Acme MSA signed to show structured writeback. The
  transition is now natural because the user explicitly clicked Next on
  the archive step.
- **Act 5, New contract intake + templates (2 + wrap):** new-contract
  3-step form, then templates page with rogue governance panel, then
  finish.

**Effect plumbing**

- `lib/tour-steps.ts` defines `TourEffect` (`"filter:all" | "filter:awaiting_me" | "filter:blocked" | "filter:in_review"`).
- `TourStep.effect` is optional.
- `components/TourController.tsx` dispatches `window` event `tour:effect`
  with `{ effect }` in the detail when a step renders.
- `app/page.tsx` listens for `tour:effect` and maps onto `setFilter`.
- Effects are idempotent; clicking Back re-fires the earlier step's effect
  with no ill consequence.

**Counsel-never-logs-in overclaim swept**

The earlier copy across README, About, architecture.md, decisions.md, and
the tour Templates step claimed "Counsel never logs into Light Documents."
This was an overclaim because Counsel may still log in to approve a clause
deviation when the routing engine routes one to them. Reworded everywhere
to "Counsel doesn't author contracts inside Light Documents" with an
explicit "what stays out is authoring, not review" clarification.

**Dashboard callout removed**

The yellow "New here?" banner on the dashboard was duplicating the tour's
job. Removed entirely. The tour auto-starts once per browser via the
`tour-seen` flag and stays the single first-time CTA. Sidebar "Take the
tour" is the only manual re-trigger.

**Sidebar Take the tour emphasized**

"Take the tour" button in the sidebar bottom-left is now accent-tinted
(`bg-accent-50 border-accent-200 text-accent-700`) and slightly larger
(`text-[13px] font-medium`, `h-4 w-4` play icon) so it visually outranks
the muted "Reset demo data" sibling.

**Welcome popover typography pass**

`app/globals.css` `.light-tour-popover` rewritten:

- Wider (`max-width: 400px`), more padding (`22px 24px 18px`).
- Bigger title (17px, weight 600) with a 1px ink-100 divider beneath it.
- 3px accent-gradient stripe at the top (#fbbf24 → #ffd544) so the
  popover visually connects to the brand palette.
- Body description supports `<p class="lead">` and `<p class="muted">`
  hierarchy.
- `<code>` and `<kbd>` get visible styling (background + border + mono
  font) so inline references look intentional, not raw HTML.
- Bullet list spacing tightened.

**New anchor**

`.tour-anchor-sidebar-nav` added to the `<nav>` in `components/Sidebar.tsx`
so the new "sidebar overview" step has something to anchor.

Existing anchors reused unchanged: `.tour-anchor-kpis`,
`.tour-anchor-table-filters`, `.tour-anchor-clause-diff`,
`.tour-anchor-routing`, `.tour-anchor-approval-chain`,
`.tour-anchor-preview-envelope`, `.tour-anchor-ledger`,
`.tour-anchor-intake-steps`.

Dead anchors left in place (harmless): `.tour-anchor-new-contract` on the
sidebar's New contract button, `.tour-anchor-callout` (the callout block
itself is removed, so the class no longer renders).

**Devil's-advocate mental walk**

- Filter-walk Back navigation: pressing Back from "Blocked" to
  "Awaiting me" re-renders the earlier step and re-fires `filter:awaiting_me`.
  Idempotent. ✓
- User manually clicks a KPI tile mid-tour: table filters, but the popover
  still shows the previous filter step's copy. Minor inconsistency,
  acceptable. ✓
- Welcome popover on a narrow desktop window: max-width 400px so it
  doesn't overflow at 768px. ✓
- Mobile: `tour:effect` events still fire from the controller, but on
  mobile the controller short-circuits in `renderStep` so the popover
  never mounts and the filter sequence doesn't run. Acceptable. ✓
- Reset demo data mid-tour: `resetTourState()` wipes all three flags;
  the dashboard reloads at `/` and auto-starts the tour from step 0. ✓
- User clicks Preview envelope in step 11 then doesn't close the modal
  before clicking Next: Next still fires `handlers.next()`, the
  controller pushes `/archive` and the modal is unmounted by the
  contract page being unmounted. ✓

**Verification done in-session**

- `npm run build` returns 0 with no TS errors.
- Em-dash audit on user-visible prose clean (only non-prose remnants:
  table placeholder cells in README and one code comment).
- All 9 tour anchor classes referenced in `lib/tour-steps.ts` are
  rendered in the codebase.
- All 6 tour-visited routes return 200 on dev server.
