# Light Documents

> Case study submission for the AI Strategy & Operations Associate role at Light (light.inc).
> Part 1 of 3: scope what to build or buy to fix Light's manual document workflow, and prototype the core.

## The problem (reframed)

The visible pain Light described:

> "We send around 50-100 documents out for signature each month. Each one gets manually edited in Word and uploaded to DocuSign with fields highlighted by hand. It is tedious and error-prone."

The real problem is not document upload. It is **controlled document execution**: there is no single path from approved business terms to a signed, audit-ready agreement whose data flows back into the Light ledger. For an AI-native ERP whose wedge is a rebuilt general ledger, contracts should be born from ledger data and return as ledger data. The PDF is just the audit artifact.

## The solution in one sentence

**Wrap DocuSign as infrastructure, keep Word + Drive for template authoring, and build a workflow layer that makes every contract complete, correct, approved, signed, and traceable into Light's ledger.**

```
Source records (Salesforce / HubSpot / Attio / Personio / Ashby / Manual entry)
       and master templates (Word docs in Drive)
                        ↓
               LIGHT DOCUMENTS (this build)
        intake → clause check → routing → envelope
                        ↓
                     DocuSign
                        ↓
            Webhook → ledger writeback
            (MRR, headcount, cap table, vendor record)
```

## Build vs buy

| Layer | Recommendation | Why |
|---|---|---|
| E-signature, identity, audit trail | **Buy / keep DocuSign** | eIDAS QES in EU, ESIGN in US, court-tested. Not our edge. |
| Template authoring | **Keep Word + Drive** | Counsel will not stop using Word. We read templates, we do not host editing. |
| Full CLM (Ironclad, Juro, SpotDraft) | **Defer** | Too heavy for 50-100 / month. Revisit at 500+ / month volume. |
| Workflow layer | **Build** | The gap, and the gap Light's ERP wedge is uniquely positioned to fill. |

## The one key decision

**Wrap DocuSign as infrastructure. Make contracts first-class ledger objects, not files.**

Three reasons:

1. **Legal.** Rebuilding the signing layer means inheriting eIDAS, ESIGN, UETA, and a decade of case-law compliance. Wrong battle for a Series A finance company.
2. **Adoption.** Counsel writes contracts in Word. Forcing them into a new editor kills the rollout. We read what they write, we do not replace where they write.
3. **Strategic fit for Light.** Light's wedge is a rebuilt general ledger. Contracts are not files, they are streams of structured data (revenue, headcount, equity, vendor obligations) that belong in the ledger. The PDF is just the audit artifact. This is the only contract approach that matches Light's product thesis.

Smallest technical embodiment: DocuSign anchor tags embedded in templates as white-on-white text, paired with typed variables. Collapses "manually drag signature fields" from 5 minutes per doc to zero, deterministically.

## How to run

```bash
cd ~/Desktop/claude/Projects/light-documents
npm install
npm run dev
# open http://localhost:3000
```

Requires Node 20+. No env vars, no auth, no database. State persists in localStorage. Reset demo data anytime via the sidebar button.

## Demo flow (the click path)

| Step | What you click | What happens |
|---|---|---|
| 1 | Land on Dashboard | KPI strip (10 in-flight, 4 blocked, 3 signed this week, avg cycle 3 days), AboutWidget with the reframe, contracts table with filter tabs |
| 2 | Click "Bolt MSA" (high-risk, in review) | Detail page renders with 3 clause deviations flagged (Net 60, unlimited liability, customer-only indemnity) and 3 approval chips pending (Legal, Head of Finance, CFO) |
| 3 | Click "Simulate: Legal approves" | Legal chip flips green. Status updates. Audit trail appends event |
| 4 | Click "Preview envelope" | Modal opens with populated MSA, variables highlighted, anchor tags highlighted, DocuSign features listed (sequential signing, 30-day expiry, day-3-7-14 reminders), conditional sections listed (Service Level Exhibit, DPA, eIDAS QES because €180k EU) |
| 5 | Approve remaining chips, click "Send via DocuSign" | Simulated 1.5-second loading, then routes to Signed Record page with audit trail and Light ledger writeback (MRR, ARR, renewal alert) |
| 6 | Click "+ New contract" | Three-step intake: pick template (8 options), pick source record (filtered by template type, shows source system badge; or switch to **Manual entry** to add a record that isn't in any CRM), confirm details (form prefilled, live validation warnings) |
| 7 | Click into "Templates" in sidebar | All 8 templates with their clause rules visible, sync metadata from Drive shown. Expand "Rogue templates detected in Drive" → 4 rogue files with Archive + Notify owner actions wired end-to-end (Notify shows the actual Slack DM body) |
| 8 | Mid-flow, change mind on an approval you just made | Each row you approved shows an **Undo my approval** pill. Click it → row goes back to pending. If yours was the last vote, the contract walks back from ready_to_send → awaiting_approval. |
| 9 | Resize to mobile width | Sidebar disappears; a sticky top bar holds the hamburger + brand. KPIs stack 2x2. Clause review becomes stacked cards. Every action bar wraps cleanly. |
| 10 | Click "About this build" in sidebar | Full submission memo in-app, including a "Legal keeps Word, not us" callout and a cast list naming every demo persona (Sara Friis, Martina Holst, Tom Bauer, etc.) as illustrative. |

10 in-flight + 4 signed contracts pre-seeded across all dashboard filters. Personas (Sara Friis, Martina Holst, Tom Bauer, Sara Lindberg, Anna Lind, Pia Andersen, Plesner, Astrid/Christian/Emma) are stand-ins, called out explicitly on `/about`.

## What works vs what is stubbed (honest)

| Layer | Working | Stubbed |
|---|---|---|
| Routing, navigation | Real Next.js App Router | none |
| State, persistence | Real localStorage with state machine, survives refresh | no real DB |
| Template + record selection | Real typed data | data itself is mock |
| Manual record entry | Real type-aware form (deal / candidate / stakeholder / vendor) with pre-filled defaults + live validation that names the missing fields | record persists locally only |
| Form validation | Real, threshold-based, live | none |
| Clause check | Real deterministic rules engine over typed `ClauseRule[]` | Not Claude. Labeled "Demo: deterministic stand-in" |
| Approval routing | Real rules engine with dedup, channels, reasons | none |
| Approval transitions | Real, immutable, via Simulate buttons. **Undo my approval** is real and walks the contract back to `awaiting_approval` if the chain is no longer complete | Real product Slacks approvers with interactive buttons |
| Reassign / Pass on / Re-ping / Reject | Real per-row workflow actions with audit-trail fan-out (new approver + previous assignee + contract owner) | Simulated DMs |
| Rogue template Archive / Notify owner | Real local state + real Slack DM preview with smart recipient routing (still-employed lastUser → DM, left-company → channel fallback, no lastUser → triage channel) | No real Slack post |
| DocuSign envelope preview | Real populated template with anchor-tag callouts + real envelope JSON shown | No real DocuSign API call |
| Send → Signed | Real state transition with realistic delay | Labeled "Demo: 3-day cycle collapsed to 1.5s" |
| Audit trail | Real, generated from journey events | timestamps relative to demo session |
| Ledger writeback | Real UI panel rendered from journey state | Labeled "Demo: simulated ledger entry" |
| Mobile UX | Real responsive layout: sticky top bar with hamburger, 2x2 KPI grid, stacked-card tables, wrap-friendly action bars | none |

Every stubbed piece carries an explicit "Demo:" callout on the screen where it appears.

## Repo map

```
app/
├── globals.css                              Tailwind base + design tokens
├── layout.tsx                               Shell (DemoBanner + Sidebar + main)
├── page.tsx                                 Dashboard
├── templates/page.tsx                       Templates library (all 7 templates with clause rules + rogue panel)
├── about/page.tsx                           In-app submission memo
└── contracts/
    ├── new/page.tsx                         3-step intake (template → record → confirm)
    └── [id]/
        ├── page.tsx                         Detail (clause review + routing + approval + send)
        └── signed/page.tsx                  Signed record (PDF + audit trail + ledger)

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
└── LedgerImpactPanel.tsx                    Ledger writeback summary (the Light-specific feature)

lib/
├── types.ts                                 Full TypeScript types (Template, Contract, ClauseRule, RoutingRule, RogueTemplate, ...)
├── mock-data.ts                             8 templates with clause rules + DocuSign config + conditional sections, 14 source records across CRM/HRIS systems, 10 in-flight + 4 signed seed contracts, 4 rogue templates
├── clause-checker.ts                        Pure deterministic rules engine
├── routing-rules.ts                         13 typed routing rules with reasons + channels
├── approver-directory.ts                    6 approver groups + specialty matching + PTO delegations
├── signer-routing.ts                        Light-side signer policy by entity + document type
├── policy-config.ts                         Governing-law allow-list + salary bands + entity→jurisdiction
├── template-meta.ts, template-meta-icons.tsx, template-bullets.tsx
├── contract-store.ts                        State machine (VALID_TRANSITIONS), immutable updates, localStorage adapter, journey commands + rogue archive/notify + undo approval
└── format.ts                                EUR + date + initials utilities

docs/
├── architecture.md                          Data flow + state model + file responsibilities
├── features.md                              Per-doc-type manual editing kill matrix
├── decisions.md                             Key decision walkthrough + alternatives considered
├── cross-functional.md                      Persona x action matrix + integration plan + RBAC
└── demo-script.md                           Loom recording script (5 min)
```

## What I would build next

| Order | Integration | Why first |
|---|---|---|
| 1 | Slack (interactive approvals via DM) | Everyone is in Slack. Zero new tool to learn. |
| 2 | Salesforce + HubSpot read | 30-50 contracts / month originate from Sales. |
| 3 | DocuSign API (real envelopes + Connect webhooks) | Replaces simulated send. Well-documented. Low risk. |
| 4 | HRIS read (Personio, Ashby, Workday) | 10-20 contracts / month from People Ops. |
| 5 | Drive / SharePoint template sync | Replaces ad-hoc folder. Required for version control + compliance. |
| 6 | Email magic links | Handles board, external counsel, non-Slack users. |
| 7 | Light ledger writeback (internal API) | The strategic moat. Light's wedge made operational. |
| 8 | Calendar alerts for renewals | Closes the loop on obligations. |

## Stated assumptions

1. Light has master Word templates in Drive (or SharePoint) owned by Legal and People, but not connected to source systems.
2. DocuSign is the existing signing tool. May have partial template / AutoPlace usage, but inconsistent.
3. Source data lives in Salesforce or HubSpot (deals), an HRIS (employees), and Light's own ledger (vendors, cap table).
4. Approvers are real humans on Slack. Routing rules are owned by Head of Finance & Ops.
5. Volume is the stated 50-100 / month. CLM-scale tools are overkill for this throughput.
6. Light has three legal entities to date: Light ApS (Denmark, primary), Light Ltd (United Kingdom, EU+UK split post-Brexit), Light Inc. (US Delaware, for US expansion).

## Tech stack

Next.js 15 App Router, TypeScript strict, Tailwind 3.4, lucide-react icons, clsx. React 19. localStorage state with a real state machine and immutable updates. No backend in this prototype.

For production: Postgres for contracts and templates, S3 / GCS for signed PDFs, Redis for queues, Vercel or AWS for hosting, SSO via Google Workspace or Okta, OAuth integrations for source systems.

## License + attribution

Built by James Hwang for a case study submission at Light. Single-author, single-session prototype. No production secrets, no proprietary code, mock data only.

See `docs/` for deeper architectural detail and per-feature reasoning.
