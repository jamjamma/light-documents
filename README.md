# Light Documents

> Case study submission for the AI Strategy & Operations Associate role at Light (light.inc).
> Part 1 of 3: scope what to build or buy to fix Light's manual document workflow, and prototype the core.

**Live demo:** https://light-documents-sigma.vercel.app/
**Repo:** https://github.com/jamjamma/light-documents
**Suggested review path:** README (top → bottom) → live demo MSA happy path → `docs/decisions.md` for the ADRs.

## The answer in one paragraph

**Wrap DocuSign as infrastructure. Keep Word + Drive for authoring. Build the workflow layer in between (intake, clause check, routing, anchor-tag envelope, ledger writeback) so every contract goes from approved business terms to a signed agreement whose data flows back into Light's systems of record.** No new editor for Counsel. No new signing primitive. The work happens in the gap, which is precisely the gap Light's ERP wedge can fill.

## The problem

The stated pain (Word edits and hand-placed DocuSign fields) is real, and the workflow below kills both directly.

While we're rebuilding the flow, there is a strategic opportunity uniquely available to Light: every signed contract is structured data (revenue, headcount, equity, vendor obligations) that belongs in the systems of record. The PDF is the audit artifact; the data is the product. Other CLMs ship integrations into N ERPs. Light *is* the ERP.

```
Source records (Salesforce / HubSpot / Attio / Personio / Ashby / Manual entry)
       and master templates (Word docs in Drive)
                        ↓
               LIGHT DOCUMENTS (this build)
        intake → clause check → routing → envelope
                        ↓
                     DocuSign
                        ↓
            Webhook → writeback to systems of record
            (Light ledger for MSAs / Order Forms, HRIS for offers,
             cap table for warrants, retention metadata for NDAs)
```

## Build vs buy

| Layer | Decision | Why |
|---|---|---|
| E-signature, identity, audit trail | **Buy / keep DocuSign** | eIDAS-compliant in EU, ESIGN in US, court-tested. Not our edge. |
| Template authoring | **Keep Word + Drive** | Counsel will not stop using Word. We read templates, we do not host editing. |
| Full CLM (Ironclad, Juro, SpotDraft) | **Defer, not dismiss** | Juro and SpotDraft now target Series A SaaS in Europe with SMB pricing and ~30-day implementations. A pilot would cover ~70% of this workflow. The 30% they don't cover is the strategic wedge: writeback into Light's ledger, routing rules owned by Head of F&O, and integration with the source records Light's customers already trust. Revisit at 500+ / month or when post-signature obligation tracking dominates. |
| Workflow layer (intake → check → route → envelope → writeback) | **Build** | The gap, and the gap Light's ERP wedge is uniquely positioned to fill. |

## Friction killed: before vs after

| Friction today | With Light Documents |
|---|---|
| 15-20 fields hand-edited in Word per MSA | 0-3 exceptions; rest prefilled from systems of record |
| 5-10 minutes dragging DocuSign fields per envelope | 0 minutes; anchor tags placed once in the master template |
| Approval chasing over Slack DMs and email | Rule-triggered routing with reasons attached to every approval |
| Wrong template version risk | Version pinned at create time; stale-banner when the master updates |
| Manual ledger entry by RevOps after signing | Structured writeback on `envelope-completed` |
| Lost contracts in inboxes | Single state machine + audit trail |

## Why Counsel will adopt this

Counsel doesn't author contracts inside Light Documents. Master templates stay as Word docs in Drive, edited where Counsel already edits. Light reads what Counsel writes; it does not host the editing. (Counsel may still log in to approve a clause deviation or sit on an approval chain. What stays out of the tool is authoring, not review.) Forcing Counsel into a new editor is the single largest reason CLM rollouts fail, and the reason we are not building one.

## The one key decision

**Wrap DocuSign as infrastructure. Make contracts first-class structured data, not files.**

Three reasons:

1. **Legal.** Rebuilding the signing layer means inheriting eIDAS, ESIGN, UETA, authority-to-bind verification, witnessing rules, and a decade of case-law compliance. Wrong battle for a Series A finance company.
2. **Adoption.** Counsel writes contracts in Word. Forcing them into a new editor kills the rollout. We read what they write; we do not replace where they write.
3. **Strategic fit for Light.** Contracts are streams of structured data (revenue, headcount, equity, vendor obligations) that belong in the systems of record Light already operates. The PDF is the audit artifact. This is the contract approach that matches Light's product thesis.

Smallest technical embodiment: DocuSign anchor tags embedded in templates as white-on-white text, paired with typed variables. Collapses "manually drag signature fields" from ~5 minutes per doc to zero, deterministically, without writing any signing code ourselves.

## Demo flow

The headline demo is an **MSA end-to-end**. The other 7 of the 8 templates use the same machinery and are shown in `/templates`. The MSA was chosen because it captures the most cross-functional pain (Sales originates, Legal reviews, Finance approves, Ledger receives).

### Hero path: MSA happy path

| Step | What you click | What happens |
|---|---|---|
| 1 | Land on Dashboard | Operator KPI strip (Awaiting me / Blocked / In review), demoted Cycle health line, **guided product tour auto-starts on first visit** (driver.js, 8 steps, dismissable). "New here?" callout offers "Take the tour" or "Open Bolt MSA". AboutWidget with the reframe, contracts table with stage tabs + type chips. |
| 2 | Click "Bolt MSA" (high-risk, in review) | Detail page renders with 3 clause deviations flagged (Net 60, unlimited liability, customer-only indemnity) and 3 approval chips pending (Legal, Head of Finance, CFO) |
| 3 | Click "Simulate: Legal approves" | Legal chip flips green; status updates; audit trail appends event |
| 4 | Click "Preview envelope" | Modal opens with populated MSA, variables and anchor tags highlighted, DocuSign features listed (sequential signing, 30-day expiry, day-3-7-14 reminders), conditional sections listed (Service Level Exhibit, DPA, eIDAS QES applied as Light signing policy for high-value EU deals; see "Note on QES" below) |
| 5 | Approve remaining chips, click "Send via DocuSign" | Demo: 3-day signing cycle collapsed to 1.5s → routes to Signed Record page with audit trail and writeback (MRR, ARR, renewal alert) |

### Extensibility paths (shown to prove the machinery generalises)

| Step | What you click | What happens |
|---|---|---|
| 6 | Click "+ New contract" | Three-step intake: pick template (8 options), pick source record (filtered by template type, with system badge; or switch to **Manual entry** for records not in any CRM), confirm details (prefilled form with live validation) |
| 7 | Click "Templates" in sidebar | All 8 templates with clause rules visible, sync metadata from Drive shown. The "Rogue templates" panel is a Phase-2 governance demo; Archive and Notify-owner are wired end-to-end with realistic Slack DM previews |
| 8 | Mid-flow, change mind on an approval you just made | Each row you approved shows an **Undo my approval** pill. Click → row reverts to pending. If yours was the last vote, the contract walks back from `ready_to_send` to `awaiting_approval` |
| 9 | Resize to mobile width | Sidebar hides; sticky top bar holds the hamburger + brand. KPIs stack 2×2. Clause review becomes stacked cards |
| 10 | Click "About this build" in sidebar | Full submission memo in-app, including the cast-list note (all personas illustrative) |

10 in-flight + 4 signed contracts pre-seeded (14 total).

### Note on QES

eIDAS QES is enforced in this workflow as **Light's signing policy** for high-value EU contracts (≥ €100k ARR) and all warrants, not because every commercial contract legally requires it. Standard B2B SaaS MSAs do not require QES under eIDAS, but applying AES/QES to high-value deals materially strengthens evidential weight in an EU court.

## What works vs what is stubbed (honest)

| Layer | Working | Stubbed |
|---|---|---|
| Routing, navigation | Real Next.js App Router | — |
| State, persistence | Real localStorage state machine, survives refresh | No real DB |
| Template + record selection | Real typed data | Data itself is mock |
| Manual record entry | Real type-aware form (deal / candidate / stakeholder / vendor) with prefilled defaults + live validation that names the missing fields | Record persists locally only |
| Form validation | Real, threshold-based, live | — |
| Clause check | Real deterministic rules engine over typed `ClauseRule[]`. **Production swaps in Claude** (see below) | Demo: deterministic stand-in |
| Approval routing | Real rules engine with dedup, channels, reasons | — |
| Approval transitions | Real, immutable, via Simulate buttons. **Undo my approval** walks the contract back to `awaiting_approval` if the chain is no longer complete | Real product fires Slack DMs with interactive buttons |
| Reassign / Pass-on / Re-ping / Reject | Real per-row workflow actions with audit-trail fan-out | Simulated DMs |
| Rogue template Archive / Notify owner | Real local state + real Slack DM preview with smart recipient routing | No real Slack post |
| DocuSign envelope preview | Real populated template with anchor-tag callouts + real envelope JSON shown | No real DocuSign API call |
| Send → Signed | Real state transition with realistic delay | Demo: 3-day cycle collapsed to 1.5s |
| Audit trail | Real, generated from journey events | Timestamps relative to demo session |
| Writeback (ledger / HRIS / cap table) | Real structured payload generated per document type (journal entry shape for MSAs / Order Forms, HRIS record for Employment, cap-table grant for Warrants) | Demo: both sides of the integration are stubbed. The prototype emits the shape on the DocuSign `envelope-completed` webhook; production needs Light to expose the receiving endpoint. |
| Mobile UX | Real responsive layout: sticky top bar with hamburger, 2×2 KPI grid, stacked-card tables, wrap-friendly action bars | — |

Every stubbed piece carries an explicit "Demo:" callout on the screen where it appears.

### Where Claude lives in production

In production, Claude (Sonnet) reads the negotiated draft, compares clause-by-clause against the pinned master, and returns a structured `ClauseCheckResult[]` with rationale per deviation. The UI binds to that shape, so swapping the engine is a one-file change.

**Routing stays rule-based even with Claude in the loop.** Claude proposes deviations; deterministic rules decide who approves. That separation is what keeps the system auditable to Finance.

The prototype ships a deterministic rules engine in the same shape for two reasons: the demo runs with no API key and no per-run cost, and reviewers can trace every flag to a typed `ClauseRule` rather than an opaque LLM call.

## Surface area: why each piece exists

This prototype has more surface than a "build an uploader" answer needs. Each piece is there because naive workflow tools break at exactly that edge:

- **Committee emission + PTO delegation.** Board flows have multiple members; one is always away. Naive tools either block the whole chain or silently drop a vote.
- **Channel-collision tiebreaking.** A single contract can fire 4 rules disagreeing on notification channel. Naive systems double-DM the same approver.
- **Template version pinning.** Counsel updating MSA v4.2 to v4.3 mid-flow must not silently change in-flight contracts.
- **Entity-aware signer routing.** A Light Ltd (UK) contract signed as "Light ApS CEO" would fail UK Companies House scrutiny.
- **NDA exception to the ledger rule** ([decisions.md §14](docs/decisions.md)). NDAs have no commercial value to post; the audit trail is the system of record. The general rule this implies: when a strategic claim is type-conditional, the catch-all path in code must be explicit, not a fallthrough.

Everything else was deliberately cut. See [`docs/decisions.md §15`](docs/decisions.md) for the full cut list.

## What I would build next

| Order | Integration | Why |
|---|---|---|
| 1 | Slack (interactive approvals via DM) | Everyone is in Slack. Zero new tool to learn. The adoption gate. |
| 2 | **Light writeback (ledger / HRIS / cap table)** | The strategic extension. Built in parallel with Slack so the first signed contract has somewhere structured to land, not just Drive. Whether the wedge is operationally live depends on Light exposing the receiving endpoints; the prototype emits the shape. |
| 3 | Salesforce + HubSpot read | 30-50 contracts / month originate from Sales. |
| 4 | DocuSign API (real envelopes + Connect webhooks) | Replaces simulated send. Well-documented. Low risk. |
| 5 | HRIS read (Personio, Ashby, Workday) | 10-20 contracts / month from People Ops. |
| 6 | Drive / SharePoint template sync | Replaces ad-hoc folder. Required for version control + compliance. |
| 7 | Email magic links | Handles board, external counsel, non-Slack users. |
| 8 | Calendar alerts for renewals | Closes the loop on obligations. |

Slack-first is for adoption; writeback at #2 is the strategic extension. In an actual rollout I would build the two in parallel, so the first signed contract has somewhere structured to land on day one, not just Drive.

## Stated assumptions

1. Light has master Word templates in Drive (or SharePoint) owned by Legal and People, not yet connected to source systems.
2. DocuSign is the existing signing tool, with partial template / AutoPlace usage but inconsistent practice.
3. Source data lives in Salesforce or HubSpot (deals), an HRIS (employees), and Light's own ledger (vendors, cap table).
4. Approvers are real humans on Slack. Routing rules are owned by Head of Finance & Ops.
5. Volume is the stated 50-100 / month. CLM-scale tools are overkill for this throughput today.
6. Light operates three legal entities (**assumed**: Light ApS (Denmark, primary), Light Ltd (UK, post-Brexit), Light Inc. (US Delaware, for US expansion)). Realistic Series A structure for a Danish-headquartered SaaS company; would verify with Head of F&O in week one.

## How to run

```bash
cd ~/Desktop/claude/Projects/light-documents
npm install
npm run dev
# open http://localhost:3000
```

Requires Node 20+. No env vars, no auth, no database. State persists in localStorage. Reset demo data anytime via the sidebar button.

## Tech stack

Next.js 15 App Router, TypeScript strict, Tailwind 3.4, lucide-react icons, clsx. React 19. localStorage state with a real state machine and immutable updates. No backend in this prototype.

For production: Postgres for contracts and templates, S3 / GCS for signed PDFs, Redis for queues, Vercel or AWS for hosting, SSO via Google Workspace or Okta, OAuth integrations for source systems.

## Repo map

```
app/
├── globals.css                              Tailwind base + design tokens
├── layout.tsx                               Shell (DemoBanner + Sidebar + main)
├── page.tsx                                 Dashboard
├── templates/page.tsx                       Templates library (all 8 templates with clause rules + rogue panel)
├── about/page.tsx                           In-app submission memo
└── contracts/
    ├── new/page.tsx                         3-step intake (template → record → confirm)
    └── [id]/
        ├── page.tsx                         Detail (clause review + routing + approval + send)
        └── signed/page.tsx                  Signed record (PDF + audit trail + writeback)

components/
├── ui/                                      Button, Card, Badge, Modal, EmptyState
├── Sidebar.tsx, MobileTopBar.tsx, MobileNavContext.tsx
├── Header.tsx, DemoBanner.tsx, Breadcrumb.tsx, BackButton.tsx
├── StatusBadge.tsx, RiskBadge.tsx, DocumentTypeIcon.tsx
├── KpiStrip.tsx, AboutWidget.tsx
├── ContractsTable.tsx                       Dashboard table with filter tabs
├── TemplateCard.tsx, TemplatePicker.tsx, TemplateDetailModal.tsx
├── RecordPicker.tsx, ManualEntryModal.tsx   Source-record picker + type-aware manual entry
├── IntakeForm.tsx                           Conditional fields per template type
├── ClauseDiff.tsx                           Clause-by-clause diff (stacked cards on mobile)
├── RoutingPanel.tsx                         Required approvals with attached reasons
├── ApprovalChain.tsx, ApprovalActionsMenu.tsx
├── ReassignModal.tsx, RejectModal.tsx
├── DocuSignPreviewModal.tsx                 Envelope preview with anchor-tag + DocuSign feature config
├── RogueTemplatesPanel.tsx                  Daily Drive scan + interactive Archive + Notify owner with Slack DM preview
├── AuditTrail.tsx                           Timeline with notification events
└── LedgerImpactPanel.tsx                    Writeback summary (the Light-specific feature)

lib/
├── types.ts                                 Full TypeScript types
├── mock-data.ts                             8 templates with clause rules + DocuSign config + conditional sections, 14 source records across CRM/HRIS systems, 14 seed contracts (10 in-flight + 4 signed), 4 rogue templates
├── clause-checker.ts                        Pure deterministic rules engine (Claude-shaped output)
├── routing-rules.ts                         13 typed routing rules with reasons + channels
├── approver-directory.ts                    6 approver groups + specialty matching + PTO delegations
├── signer-routing.ts                        Light-side signer policy by entity + document type
├── policy-config.ts                         Governing-law allow-list + salary bands + entity→jurisdiction
├── template-meta.ts, template-meta-icons.tsx, template-bullets.tsx
├── contract-store.ts                        State machine, immutable updates, localStorage adapter, journey commands
└── format.ts                                EUR + date + initials utilities

docs/
├── architecture.md                          Data flow + state model + file responsibilities
├── features.md                              Per-doc-type manual editing kill matrix
├── decisions.md                             Key decision walkthrough + alternatives considered
├── cross-functional.md                      Persona × action matrix + integration plan + RBAC
└── demo-script.md                           Loom recording script (5 min)
```

## License + attribution

Built by James Hwang for a case study submission at Light. Single-author, single-session prototype. No production secrets, no proprietary code, mock data only.

See `docs/` for deeper architectural detail and per-feature reasoning.
