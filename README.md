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
| 1 | Land on Dashboard | KPI strip (6 in-flight, 2 blocked, avg cycle 3 days), AboutWidget with the reframe, contracts table with filter chips |
| 2 | Click "Bolt MSA" (high-risk, in review) | Detail page renders with 3 clause deviations flagged (Net 60, unlimited liability, customer-only indemnity) and 3 approval chips pending (Legal, Head of Finance, CFO) |
| 3 | Click "Simulate: Legal approves" | Legal chip flips green. Status updates. Audit trail appends event |
| 4 | Click "Preview envelope" | Modal opens with populated MSA, variables highlighted, anchor tags highlighted, DocuSign features listed (sequential signing, 30-day expiry, day-3-7-14 reminders), conditional sections listed (Service Level Exhibit, DPA, eIDAS QES because €180k EU) |
| 5 | Approve remaining chips, click "Send via DocuSign" | Simulated 1.5-second loading, then routes to Signed Record page with audit trail (8 events) and Light ledger writeback (+€15k MRR, +€180k ARR, renewal alert) |
| 6 | Click "+ New contract" | Three-step intake: pick template (5 options), pick source record (filtered by template type, shows source system badge), confirm details (form prefilled, live validation warnings) |
| 7 | Click into "Templates" in sidebar | All 5 templates with their clause rules visible, sync metadata from Drive shown |
| 8 | Click "About this build" in sidebar | Full submission memo in-app |

Five demo scenarios pre-seeded: Acme MSA (happy path), Bolt MSA (non-standard), Jane Sørensen employment (standard), Marcus Lee employment (above-band), Anya Petrov warrant (Board-blocked). Plus Linear MSA and Datadog vendor renewal as pre-completed examples showing ledger writeback.

## What works vs what is stubbed (honest)

| Layer | Working | Stubbed |
|---|---|---|
| Routing, navigation | Real Next.js App Router | none |
| State, persistence | Real localStorage with state machine, survives refresh | no real DB |
| Template + record selection | Real typed data | data itself is mock |
| Form validation | Real, threshold-based, live | none |
| Clause check | Real deterministic rules engine over typed `ClauseRule[]` | Not Claude. Labeled "Demo: deterministic stand-in" |
| Approval routing | Real rules engine with dedup, channels, reasons | none |
| Approval transitions | Real, immutable, via Simulate buttons | Real product Slacks approvers |
| DocuSign envelope preview | Real populated template with anchor-tag callouts | No real DocuSign API call |
| Send → Signed | Real state transition with realistic delay | Labeled "Demo: 3-day cycle collapsed to 1.5s" |
| Audit trail | Real, generated from journey events | timestamps relative to demo session |
| Ledger writeback | Real UI panel rendered from journey state | Labeled "Demo: simulated ledger entry" |

Every stubbed piece carries an explicit "Demo:" callout on the screen where it appears.

## Repo map

```
app/
├── globals.css                              Tailwind base + design tokens
├── layout.tsx                               Shell (DemoBanner + Sidebar + main)
├── page.tsx                                 Dashboard
├── templates/page.tsx                       Templates library (all 5 templates with clause rules)
├── about/page.tsx                           In-app submission memo
└── contracts/
    ├── new/page.tsx                         3-step intake (template → record → confirm)
    └── [id]/
        ├── page.tsx                         Detail (clause review + routing + approval + send)
        └── signed/page.tsx                  Signed record (PDF + audit trail + ledger)

components/
├── ui/                                      Button, Card, Badge, Modal, EmptyState
├── Sidebar.tsx, Header.tsx, DemoBanner.tsx
├── StatusBadge.tsx, RiskBadge.tsx
├── KpiStrip.tsx, AboutWidget.tsx
├── ContractsTable.tsx                       Dashboard table with filter chips
├── TemplateCard.tsx, TemplatePicker.tsx
├── RecordPicker.tsx                         CRM-agnostic source record picker
├── IntakeForm.tsx                           Conditional fields per template type
├── ClauseDiff.tsx                           Clause-by-clause diff with severity coloring
├── RoutingPanel.tsx                         Required approvals with attached reasons
├── ApprovalChain.tsx                        Approver chips with channel + delegate + simulate
├── DocuSignPreviewModal.tsx                 Envelope preview with anchor-tag + DocuSign feature config
├── AuditTrail.tsx                           Timeline with notification events
└── LedgerImpactPanel.tsx                    Ledger writeback summary (the Light-specific feature)

lib/
├── types.ts                                 Full TypeScript types (Template, Contract, ClauseRule, RoutingRule, ...)
├── mock-data.ts                             5 templates with clause rules + DocuSign config + conditional sections, 8 source records across CRM/HRIS systems, 8 seed contracts pre-hydrated
├── clause-checker.ts                        Pure deterministic rules engine
├── routing-rules.ts                         12 typed routing rules with reasons + channels + salary band data
├── contract-store.ts                        State machine (VALID_TRANSITIONS), immutable updates, localStorage adapter, journey commands
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
