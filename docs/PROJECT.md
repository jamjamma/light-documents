# Light Documents — Project Reference

> Single-page map of the entire build. Read top-to-bottom for a full mental
> model. Each section is self-contained so you can jump in mid-doc.

---

## 1. The reframe (one sentence)

**The stated pain (Word edits and hand-placed DocuSign fields) is real, and the workflow below kills both directly. The bigger prize uniquely available to Light: every signed contract is structured data that belongs in the systems of record.** Other CLMs ship integrations into N ERPs. Light *is* the ERP.

The PDF is the audit artifact; the data is the product. Routing per document type: MSAs / Order Forms → revenue and billing, Employment → headcount and compensation, Warrants → cap table, Vendor → AP, NDAs → retention metadata only (see ADR 14).

---

## 2. End-to-end value chain

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Source systems  │   │ Master templates │   │  Approver dir +  │
│  Salesforce      │   │ Word docs in     │   │  Policy config   │
│  HubSpot, Attio  │   │ Drive owned by   │   │  (jurisdictions, │
│  Personio, Ashby │   │ Legal, parsed    │   │   salary bands,  │
│  Manual entry    │   │ for {{vars}} +   │   │   groups, PTO    │
│                  │   │ \\sig:anchor\\   │   │   delegations)   │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │ read                  │ read                 │ read
         │                       │                      │
         ▼                       ▼                      ▼
    ┌───────────────────────────────────────────────────────────┐
    │                    LIGHT DOCUMENTS                        │
    │                                                           │
    │  1. INTAKE      Pick template + record, prefill, validate │
    │  2. CHECK       Clause-rule engine flags deviations       │
    │  3. ROUTE       Rule-engine picks roles → directory picks │
    │                 individuals (specialty + PTO-aware)       │
    │  4. APPROVE     Per-row actions: simulate, reassign,      │
    │                 pass-on, re-ping, reject                  │
    │  5. SIGN        DocuSign envelope w/ anchor-tag fields,   │
    │                 entity-aware Light-side signer            │
    │  6. FILE        Audit trail + ledger writeback            │
    └────────┬──────────┬──────────┬──────────┬─────────────────┘
             │          │          │          │
             ▼          ▼          ▼          ▼
        ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
        │ Slack  │ │DocuSign│ │ Email  │ │  Light   │
        │ DM +   │ │ create │ │ magic  │ │  ledger  │
        │channel │ │envelope│ │ links  │ │ +MRR +HC │
        └────────┘ └────────┘ └────────┘ └──────────┘
```

The four exits (Slack / DocuSign / Email / writeback) are the four real-world surfaces that matter. All four are simulated in the prototype; the structured writeback into systems of record is the strategic extension.

---

## 3. Architecture in one screen

```
                            ┌─────────────────────────────────────┐
                            │             app/ (Next.js)           │
                            │  pages: dashboard, templates, new,   │
                            │         contract[id], signed[id],    │
                            │         archive, about               │
                            └────────────┬─────────────────────────┘
                                         │
                            ┌────────────▼─────────────────────────┐
                            │           components/                │
                            │  - UI primitives (Button, Modal, …)  │
                            │  - Domain widgets (ApprovalChain,    │
                            │    ClauseDiff, DocuSignPreviewModal, │
                            │    IntakeForm, RecordPicker, …)      │
                            │  - Action surfaces (ReassignModal,   │
                            │    RejectModal, ApprovalActionsMenu) │
                            └────────────┬─────────────────────────┘
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        │                              lib/                               │
        │                                                                 │
        │  types.ts          single source of truth for every type        │
        │                                                                 │
        │  policy-config     gov-law allow-list, salary bands (jurisdic), │
        │                    entity → jurisdiction                        │
        │  template-meta     category + recency for cards (data only)     │
        │  template-meta-icons  JSX icons split off                       │
        │  template-bullets  per-template marketing bullets               │
        │                                                                 │
        │  approver-directory  groups, members, specialty tags, PTO       │
        │                      delegations, selectApprover() engine       │
        │  signer-routing    entity-aware Light-side signers + witness    │
        │                                                                 │
        │  clause-checker    pure runChecks(template, fields) → results   │
        │  routing-rules     12 typed rules + computeRouting() with       │
        │                    channel-collision + committee handling       │
        │                                                                 │
        │  contract-store    state machine + journey commands +           │
        │                    localStorage adapter (the operating core)    │
        │                                                                 │
        │  mock-data         8 templates, 14 source records, 14 seed     │
        │                    contracts hydrated through the real engines  │
        │                                                                 │
        │  format.ts         EUR / date / initials helpers                │
        └─────────────────────────────────────────────────────────────────┘
```

**Dependency direction:** UI → components → lib. Nothing in `lib/` knows about React. `contract-store.ts` is `"use client"` only because of `localStorage`. The engines (`clause-checker`, `routing-rules`, `approver-directory`, `signer-routing`, `policy-config`) are pure data + functions.

---

## 4. State machine

```
   draft  ──→  checks_running  ──→  in_review  ──→  awaiting_approval  ──→  ready_to_send  ──→  sent  ──→  signed  ──→  filed
     ▲              │                  │                  │                       │
     │              │                  │                  │                       │
     │              ▼                  │                  │                       │
   needs_info ◄────┘             ready_to_send       needs_info  (rejection bounce)
                                      │                  │
                                      │                  │
                                      ▼                  ▼
                                    draft           in_review
```

Defined in `lib/contract-store.ts:VALID_TRANSITIONS`. Every command:
- throws on invalid transition,
- returns a new immutable `Contract`,
- appends an `AuditEvent` atomically.

`localStorage` key `light-documents-state` holds `{version, contracts, manualSourceRecords?, rogueActions?, seededAt}`. Bumping `STATE_VERSION` invalidates old state and re-seeds. Current version: **9** (bumped to invalidate stale flat-shape `ledger` data and force re-seed with the new structured `journalEntry` / `hrisRecord` / `capTableDelta` blocks).

---

## 5. The three logic engines

### 5a. Clause checker — `lib/clause-checker.ts`
Pure function over typed `ClauseRule[]` attached to each template. Each rule carries:
- `predicate(fields) → boolean` (is this standard?)
- `observed(fields) → string` (the value in the draft)
- `expected`, `severity` (`info` / `warn` / `block`), `reason`

Output: `ClauseCheckResult[]` with status `standard` or `deviation`. The UI binds to this shape. **Swapping the engine for a Claude API call is a one-file change** — the contract with the UI is the result shape, not the engine.

### 5b. Routing engine — `lib/routing-rules.ts` + `lib/approver-directory.ts`

Two-stage:

1. **Rule layer** (`routing-rules.ts`): 13 typed `RoutingRule` objects with `appliesTo`, `trigger`, `approver` (a role), `channel`, `autoApproveIfStandard`, `reason`. `computeRouting()` deduplicates by role, picks the most-restrictive channel on collision, and emits the chain. Committee roles (`all_required` strategy) emit one `Approval` per member so `allApproved()` actually requires every vote.

2. **Directory layer** (`approver-directory.ts`): for each role, an `ApproverGroup` holds 1..N members with specialty tags (`type:Warrant`, `jurisdiction:UK`, `entity:Light Ltd …`) and a `strategy` (`specialty_match` / `named_default` / `all_required` / `any_round_robin`). `selectApprover()` scores members by weighted specialty match (type=10, entity=2, jurisdiction=1) so a UK MSA picks the UK in-house counsel over the Danish one, and a Warrant picks outside counsel over either in-house counsel. Active PTO `Delegation` entries automatically reroute to the named backup with `delegateOfName` set for the UI.

### 5c. Signer routing — `lib/signer-routing.ts`
`ENTITY_SIGNERS[Jurisdiction]` maps each Light entity (DK / UK / US) to its statutory CEO + title. `LIGHT_SIGNER_POLICY[DocumentType]` declares which Light-side roles must sign per doc type (MSA → CEO, Warrant → CFO + CEO + Witness, Vendor → Head of F&O). `resolveSigners(contract, template)` returns the ordered envelope with rationale per signer. `primaryLightSignerActor()` is the audit-trail string used by `simulateSigned()` so a UK contract reads "Jonathan Sanders (CEO, Light Ltd)" instead of just "(CEO)".

---

## 6. Module-by-module deep dive (`lib/`)

| Module | Purpose | Key exports |
|---|---|---|
| `types.ts` | The contract for every other module. Document types, jurisdictions, stages, approvals, templates, routing rules, source records, audit events, ledger impact, approver group/member/delegation. | `Contract`, `Template`, `Approval`, `ApproverGroup`, `RoutingRule`, `ClauseRule`, `SourceRecord`, `Stage`, `ApproverRole`, `Jurisdiction`, `SpecialtyTag`, `CHANNEL_RESTRICTIVENESS` |
| `policy-config.ts` | Single source of truth for company policy: accepted governing laws, salary bands per jurisdiction, entity→jurisdiction map. Removed 3 inline copies of the law allow-list and a DK-only salary bands constant. | `isAcceptedLaw`, `getSalaryBand`, `isSalaryAboveBand`, `jurisdictionForEntity`, `ACCEPTED_GOVERNING_LAWS`, `SALARY_BANDS` |
| `template-meta.ts` | Shared template-display metadata: category, blurbs, pill colors, recency calculation. Removed 3 duplicate `TEMPLATE_CATEGORY` maps. JSX-free so Node tests can import. | `TEMPLATE_CATEGORY`, `CATEGORY_ORDER`, `CATEGORY_BLURB`, `CATEGORY_PILL`, `recentUpdateInfo` |
| `template-meta-icons.tsx` | The JSX icons for category section headers, separated from `template-meta.ts` so the data module stays pure. | `CATEGORY_ICON` |
| `template-bullets.tsx` | Per-template bullets shown on cards. Tiny mapping function. | `bulletsForTemplate` |
| `clause-checker.ts` | Pure rules engine. Runs every clause rule attached to a template against contract fields. | `runChecks`, `countDeviations`, `hasBlockingDeviation`, `allStandard`, `summarizeChecks` |
| `approver-directory.ts` | 6 approver groups (Legal, Head of F&O, CFO, People Ops, CEO, Board) with 13 members total. PTO delegation (Anna Lind 2026-05-10 → 2026-05-20). Specialty matching with weighted classes. | `selectApprover`, `selectAllMembers`, `listMembers`, `findMember`, `getApproverGroup`, `listActiveDelegations` |
| `signer-routing.ts` | Light-side signer policy per template + entity. Counterparty, light signer, witness. | `resolveSigners`, `resolveLightSigners`, `resolveCounterpartySigner`, `resolveWitnessSigner`, `primaryLightSignerActor`, `lightSignerRationale` |
| `routing-rules.ts` | 13 routing rules + `computeRouting()`. Channel collision resolution. Committee emission for `all_required` groups. | `ROUTING_RULES`, `computeRouting`, `allApproved` |
| `contract-store.ts` | The operating core. State machine, immutable updates, localStorage persistence, journey commands, workflow actions. | `getContract`, `listContracts`, `createContract`, `runClauseChecks`, `approve`, `reassignApproval`, `rejectApproval`, `repingApproval`, `saveDraftAndExit`, `send`, `simulateSigned`, `resetDemo`, `computeKpis` |
| `mock-data.ts` | 8 templates with full clause rules + DocuSign config + version history + conditional sections. 14 source records across Salesforce / HubSpot / Attio / Personio / Ashby / Manual. 14 seed contracts (10 in-flight + 4 signed) pre-hydrated through `runChecks` + `computeRouting`. 4 rogue templates. | `TEMPLATES`, `SOURCE_RECORDS`, `SEED_CONTRACTS`, `ROGUE_TEMPLATES`, `getTemplate`, `getSourceRecord`, `LIGHT_ENTITIES` |
| `format.ts` | EUR + date + initials helpers. | `formatEur`, `formatEurCompact`, `formatDate`, `formatDateTime`, `relativeDays`, `initials` |

---

## 7. Components

### UI primitives — `components/ui/`
`Button`, `Card`, `Badge`, `Modal` (with `headerActions` slot), `EmptyState`. Tailwind-styled, no behavioural logic.

### Layout
`Sidebar` (slide-in drawer on mobile, collapse-to-icons on desktop, state persists in localStorage), `MobileTopBar` (sticky top bar that hosts the hamburger on mobile so it has a clear anchor instead of floating over scrolled content), `MobileNavContext` (shared drawer-open state between Sidebar and MobileTopBar), `Header` (stacks title + actions on mobile, normal padding on desktop), `Breadcrumb`, `DemoBanner`.

### Domain widgets
- **`ContractsTable`** — sortable, stage filter tabs (All in-flight / Awaiting me / Blocked / In review) plus a type-chip row (All types / MSA / Order Form / NDA / Employment / Warrant). The two filters compose. Tabs and chips scroll horizontally on mobile.
- **`KpiStrip`** — responsive KPI row. 2x2 grid on mobile, single row on `sm+`. Used on Dashboard + Archive.
- **`ClauseDiff`** — clause-by-clause diff with severity coloring (info / warn / block). Stacked cards on mobile, table on desktop.
- **`RoutingPanel`** — *why* this chain exists (rule reasons).
- **`ApprovalChain`** — *who* + *why-this-person* + the per-row action menu. Renders an "Undo my approval" pill on rows the current operator (Martina) approved, so a mind-change before send is one click. Refuses on `sent` / `signed` / `filed`.
- **`ApprovalActionsMenu`** — dropdown for Reassign / Re-ping / Reject. Click-away aware.
- **`ReassignModal`** — picker with specialty chips, OOO badges, intent toggle (Reassign vs Pass on), reason presets.
- **`RejectModal`** — danger flow with reason presets, returns the contract to `needs_info`.
- **`IntakeForm`** — conditional fields per `DocumentType` (MSA, NDA, Order Form, Employment, Warrant).
- **`RecordPicker`** — CRM-agnostic source-record list with system badges.
- **`ManualEntryModal`** — type-aware manual record entry (deal / candidate / stakeholder / vendor) that sits alongside CRM/HRIS imports. Pre-fills safe boilerplate (vesting 48m, cliff 12m, payment net 30), required-but-empty fields get amber borders, validation hint sits next to the button.
- **`TemplateCard`** + **`TemplatePicker`** + **`TemplateDetailModal`** — share visual language via `template-meta.ts`. Detail modal renders the clause rules as stacked cards on mobile, table on desktop.
- **`DocuSignPreviewModal`** — multi-page envelope preview, signature blocks placed by anchor tags, API-payload toggle showing the actual `recipients` + `tabs` JSON.
- **`AuditTrail`** — chronological event list with icons per event type.
- **`LedgerImpactPanel`** — the ledger writeback (MRR, headcount, cap-table delta).
- **`RogueTemplatesPanel`** — detected rogue copies of master templates with similarity scores + recommended action. Archive + Notify owner are interactive: Archive dims the row and surfaces an Undo pill; Notify opens an inline Slack DM preview (routing rationale + the exact `chat.postMessage` body + a production note about Interactivity buttons) and on Send replaces the buttons with a green "sent" stamp. State persists via `rogueActions` in localStorage, cleared on Reset demo.
- **`StatusBadge`** + **`RiskBadge`** + **`DocumentTypeIcon`** — typography micro-components reused everywhere.
- **`AboutWidget`** — the dashboard preamble that explains the build.

---

## 8. Pages — `app/`

| Route | Purpose | Notable bits |
|---|---|---|
| `/` | Dashboard | KPI strip, AboutWidget, ContractsTable with filter chips |
| `/templates` | Catalog | Section view (Customer / People / Equity) with recency badges, rogue-templates panel, top notice strip, "+ New contract" CTA in header |
| `/contracts/new` | 3-step intake | Step 1 (template picker, shared visual language with catalog), Step 2 (record picker; can switch to **Manual entry** tab to add a record that's not in any CRM), Step 3 (intake form with live validation). Reads `?template=` query param. |
| `/contracts/[id]` | Contract detail | Stale-template banner, ClauseDiff, RoutingPanel, ApprovalChain with action menus, DocuSign send card with Save Draft / Preview / Send |
| `/contracts/[id]/signed` | Signed record | PDF callout, audit trail, ledger impact panel, linked records |
| `/archive` | All filed contracts | Lifetime KPIs, signed-record table |
| `/about` | In-app submission memo | Same problem reframe + build-vs-buy as the README, plus a "Legal keeps Word, not us" callout and a one-sentence cast-list note that all personas are illustrative stand-ins. |

---

## 9. The approval workflow — happy path + every branch

### Happy path
```
intake → checks pass → routing emits N approvals → each approver clicks Approve
       → ready_to_send → Send via DocuSign → sent → signed → filed → ledger writeback
```

### Branch: rejection
```
… → approver clicks Reject (RejectModal: reason required)
   → status=rejected on that row
   → stage transitions to needs_info
   → owner gets simulated Slack DM with reason
   → owner fixes fields, re-runs checks, chain re-emits, cycle continues
```

### Branch: reassignment (operator override)
```
… → Head of F&O clicks Reassign on a pending row (ReassignModal)
   → picks a different member of the group, types a reason
   → row updates: assignedName, selectionReason="Manually reassigned from X by Y…"
   → audit event records who overrode whom + reason
   → simulated Slack DM to the new approver
```

### Branch: pass-on (assignee delegates)
```
Same modal as Reassign, intent toggle set to "Pass on". Attribution flips:
   selectionReason="Passed on from X by X (self)…"
   delegateOfName=X
```

### Branch: re-ping (nudge a slow approver)
```
Owner clicks Re-ping → no state change, two audit events:
   "Re-pinged {name} for {role} approval"  (owner)
   "Slack DM re-sent to {name}"            (system)
```

### Branch: PTO delegation (automatic)
```
At routing time, if the picked member has an active Delegation:
   selectionReason notes "for {original_name}; PTO until {date}"
   delegateOfName = original
   The chain UI shows the amber "Delegating for Anna Lind" pill.
```

### Branch: committee (all_required)
```
Board role has 3 members and strategy=all_required.
   computeRouting emits 3 separate Approval rows.
   approve() matches on (role, assignedUserId) so Astrid clicking does NOT
   clear Christian or Emma.
   allApproved() returns false until all 3 approve.
```

### Branch: save & exit
```
Owner clicks Save Draft & Exit → audit event "Saved draft for later
   (owner stepped away)", returns to dashboard. Auto-save is already on;
   this is a deliberate "I'm parking this" signal for analytics + future
   follow-up DMs.
```

### Branch: undo my approval
```
Operator (simulated Martina) approves a row, changes her mind before send →
   clicks "Undo my approval" on her own row
   → undoApproval() flips status back to pending, clears decidedAt/decidedBy
   → audit event records "Withdrew approval"
   → if her row was the last pending one and the contract had advanced to
     ready_to_send, stage walks back to awaiting_approval with a system audit
     event "Chain no longer complete; back to awaiting approval"
Refused on sent / signed / filed — once DocuSign has the envelope, the chain
is out of the platform's hands. The store also rejects undo from anyone other
than the original approver: operators withdrawing someone else's approval
would erode the audit trail; route them through Reassign or Reject instead.
```

---

## 9b. Rogue templates: archive + notify

Live on `/templates` (the rose-bordered panel under the catalog header).
Daily Drive scan flags docs outside `/Master Templates/` that look like master
templates but are not. Each row carries `fileName`, `similarity`,
`diffSummary`, `lastUsedBy`, `recommendedAction`. The operator has two
actions:

### Archive
```
Click Archive → archiveRogue() persists {at, by} under rogueActions[fileId]
   → row dims, "rogue" badge swaps to "archived", icon swaps to Archive
   → Undo pill appears: "Archived by Martina · time · ↩ Undo"
Production: move the docx in Drive to /Master Templates/_rogue-archive/<year>,
write a rogue-archived audit event, surface a banner in Drive if anyone has
the file open.
```

### Notify owner
```
Click Notify owner → inline Slack DM preview opens with:
   - recipient routing rationale (data-driven from rogue record):
        * still-employed lastUsedBy → DM by name
        * lastUsedBy contains "left company" → channel fallback (#sales-ops)
        * no lastUsedBy → triage channel (#legal-rogue-templates)
   - the exact Slack message body that would post
   - a production note about chat.postMessage + Interactivity buttons +
     audit-log thread-back
Click Send → notifyRogueOwner() records {at, by, channel, recipient}
   → preview collapses to green pill "Slack DM/channel sent to X · time · ↩ Undo"
```

Both actions persist in `rogueActions` under localStorage and clear on Reset
demo. The state shape is keyed by `driveFileId` so a row can be both archived
AND notified independently.

---

## 10. Data model in plain English

- A **Template** is a master Word doc + typed clause rules + DocuSign config + version history.
- A **Contract** is a Template + a SourceRecord + the user-entered fields + a stage + an audit trail. Auto-saves to localStorage on every command.
- A **ClauseCheckResult** is what one clause looked like in this contract vs the master.
- An **Approval** is one row in the chain: a role + the rule reason + a channel + an assigned individual + a status. Committees emit N approvals for the same role.
- An **ApproverGroup** is a role's members + their specialty tags + the selection strategy.
- A **Delegation** is "user X is out from date1 to date2; route their work to user Y".
- A **SignerDef** is one DocuSign envelope recipient + their routing order + their selection rationale.
- A **LedgerImpact** is the post-signing writeback shown to the user (MRR, headcount, cap table…).

---

## 11. Mock vs real

| Layer | Working today | Production swap |
|---|---|---|
| Routing, navigation, state machine | Real Next.js App Router + immutable state machine | same |
| Persistence | localStorage with version key | Postgres + S3 for PDFs |
| Auth | Single-user (Martina persona) | Google Workspace SSO + RBAC |
| Source systems | Mock `SourceRecord[]` across 6 vendors | OAuth + webhooks per vendor (Salesforce, HubSpot, Attio, Personio, Ashby, Workday) |
| Template sync | Mock metadata | Google Drive Watch API + `docxtemplater` |
| Clause checker | Deterministic typed rules engine | Same shape, swap engine to a Claude API call. One-file change. |
| Routing engine | Real, with channel collision + committee logic | Same |
| Approver directory | TS module | Postgres table + settings UI |
| Slack notifications | Simulated audit events ("Slack DM sent to …") | Slack Bolt app with interactive buttons |
| DocuSign send | Real envelope JSON shown in modal, no API call | `POST /v2.1/accounts/{id}/envelopes` + Connect webhooks |
| Signing | Simulated 1.2s delay → signed | DocuSign Connect: `envelope-completed` → fetch PDF + structured data |
| Ledger writeback | Rendered UI panel | Internal API call to Light ledger |
| Calendar / reminders | Not implemented | Cron worker reading `docusignFeatures.reminderDays` |

Every stubbed surface is labelled with a `Demo:` callout in the UI.

---

## 12. Docs and ancillaries

| File | Purpose |
|---|---|
| `README.md` | The submission entry point. Problem reframe, build vs buy, run instructions, demo flow, repo map, stated assumptions, tech stack. |
| `SESSION-HANDOFF.md` | Session-state notes for continuing work across coding sessions. |
| `docs/architecture.md` | Data flow + state model + per-engine deep dive. |
| `docs/decisions.md` | Every key product/architectural decision with alternatives considered. 13 decisions including the late-stage closures from the audit (group-based approvers, signer routing, policy as data, template pinning, channel collision). |
| `docs/features.md` | Per-doc-type "manual editing kill matrix" — for each template, what was edited by hand and how the system eliminates it. |
| `docs/cross-functional.md` | Persona × action matrix, RBAC, integration plan, failure modes. |
| `docs/demo-script.md` | The 5-minute Loom narration script. |
| `docs/PROJECT.md` | **This document.** Full project map. |
| `case-study/PART-2-COHORT-ANALYSIS.md` | SaaS cohort analysis answers (NRR diagnosis + ARR projection). |
| `case-study/PART-3-DAY-ONE.md` | Day-one mindset: first-week plan, point-of-view to test with Martina. |
| `package.json` | Next 15.1.3, React 19, Tailwind 3.4, lucide-react, clsx. Zero backend deps. |
| `tsconfig.json` | TypeScript strict, path alias `@/*`. |
| `tailwind.config.ts` | Custom palette (ink / accent / sage), font + radius tokens. |
| `next.config.ts` | Defaults. No env vars. No middleware. |

---

## 13. File tree (essentials)

```
light-documents/
├── app/
│   ├── globals.css
│   ├── layout.tsx                    Shell: DemoBanner + Sidebar + main
│   ├── page.tsx                      Dashboard
│   ├── about/page.tsx                In-app submission memo
│   ├── archive/page.tsx              Signed/filed contracts + lifetime KPIs
│   ├── templates/page.tsx            Catalog: sections, recency strip, modal
│   └── contracts/
│       ├── new/page.tsx              3-step intake (template → record → confirm)
│       └── [id]/
│           ├── page.tsx              Detail: clauses + routing + chain + send
│           └── signed/page.tsx       Signed record + audit + ledger
│
├── components/
│   ├── ui/                           Button, Card, Badge, Modal, EmptyState
│   ├── Sidebar.tsx                   Drawer on mobile + collapse-to-icons on desktop
│   ├── MobileTopBar.tsx              Sticky top bar that hosts the hamburger on mobile
│   ├── MobileNavContext.tsx          Shared drawer-open state
│   ├── Header.tsx                    Stacks title + actions on mobile
│   ├── DemoBanner.tsx, Breadcrumb.tsx, BackButton.tsx
│   ├── KpiStrip.tsx, AboutWidget.tsx
│   ├── StatusBadge.tsx, RiskBadge.tsx, DocumentTypeIcon.tsx
│   ├── ContractsTable.tsx
│   ├── TemplateCard.tsx              + TemplatePicker.tsx + TemplateDetailModal.tsx
│   ├── RecordPicker.tsx              + ManualEntryModal.tsx
│   ├── IntakeForm.tsx
│   ├── ClauseDiff.tsx
│   ├── RoutingPanel.tsx
│   ├── ApprovalChain.tsx             + ApprovalActionsMenu.tsx
│   ├── ReassignModal.tsx             + RejectModal.tsx
│   ├── DocuSignPreviewModal.tsx
│   ├── AuditTrail.tsx
│   ├── LedgerImpactPanel.tsx
│   └── RogueTemplatesPanel.tsx
│
├── lib/
│   ├── types.ts                      One source of truth for every type
│   ├── policy-config.ts              Governing law + salary bands + entity→jurisdiction
│   ├── template-meta.ts              Category metadata + recency (data only)
│   ├── template-meta-icons.tsx       JSX icons split off
│   ├── template-bullets.tsx          Per-template bullet text
│   ├── approver-directory.ts         Groups, members, delegations, selectApprover
│   ├── signer-routing.ts             Light-side signers by entity + template
│   ├── clause-checker.ts             Pure rules engine
│   ├── routing-rules.ts              13 rules + computeRouting()
│   ├── contract-store.ts             State machine + journey commands + localStorage
│   ├── mock-data.ts                  Templates + sources + seed contracts
│   └── format.ts                     EUR / date / initials helpers
│
├── docs/
│   ├── architecture.md
│   ├── features.md
│   ├── decisions.md
│   ├── cross-functional.md
│   ├── demo-script.md
│   └── PROJECT.md                    ← this document
│
├── case-study/
│   ├── PART-2-COHORT-ANALYSIS.md
│   └── PART-3-DAY-ONE.md
│
├── README.md
├── SESSION-HANDOFF.md
└── package.json, tsconfig.json, tailwind.config.ts, next.config.ts, postcss.config.mjs
```

Heaviest file is `mock-data.ts` (templates + seed data + version history). Everything else is small and focused per the file-per-concern split documented above.

---

## 14. The demo path (exact click sequence, ~5 min)

| # | Action | What the interviewer sees |
|---|---|---|
| 1 | Land on `/` (Dashboard) | KPI strip, AboutWidget with the reframe, contracts table |
| 2 | Click **Templates** | Top: "5 templates updated in the last 90 days" strip with clickable chips. Cards show category pills (Customer/People/Equity), risk badges bottom-right, recency badges (orange "New template" on Advisor Warrant + MSA Pilot; green "Updated" on MSA, Order Form, NDA) |
| 3 | Click "View details" on **MSA v4.2** | Detail modal opens. Recency banner at top with full change note. "+ New contract" button in header. Five clause rules listed (trimmed for demo). |
| 4 | Click **"+ New contract"** in modal header | Lands on `/contracts/new?template=msa_v4_2`, jumps directly to step 2 (record picker) |
| 5 | Pick a Salesforce deal | Step 3: intake form prefilled with deal data, live warnings (ARR ≥ €100k → CFO approval; Net 60 → non-standard) |
| 6 | Click **Run checks** | Detail page renders: stale-template banner if applicable, ClauseDiff with 5 rules, RoutingPanel ("triggered by" rules), ApprovalChain with assigned individuals + selection reasons |
| 7 | Click ⋯ on the **Legal** row → **Reassign** | Modal with all 4 Legal members, specialty chips, amber OOO badge on Anna Lind. Pick Anna, type a reason, confirm. Watch the row update and the audit trail capture the override. |
| 8 | Click ⋯ on the **CFO** row → **Re-ping** | Audit appends "Re-pinged Magnus" + "Slack DM re-sent" |
| 9 | Click ⋯ on the **CEO** row → **Reject** | Modal with reason presets. Confirm. Contract bounces to `needs_info`, rose-tinted rejection callout appears under the row. |
| 10 | (For committee demo) Open an existing **Warrant** contract | Notice **3 separate Board rows** (Astrid, Christian, Emma). Approve only Astrid → "Send" stays blocked. |
| 11 | On the Approve all chain → **Save draft & exit** | Returns to dashboard. Audit trail captured "Owner stepped away". Open back the contract → state preserved. |
| 12 | Re-approve all → **Preview envelope** | DocuSign modal: 6 pages with anchor tags highlighted, sidebar shows each signer with "why" rationale, "Show API call" reveals the actual envelope JSON |
| 13 | Click **Send via DocuSign** | Simulated 1.2s delay, lands on `/contracts/[id]/signed` with audit trail (8+ events) and ledger impact (+€xk MRR, +€xk ARR, renewal alert) |
| 14 | Resize browser to mobile width | Sidebar disappears; a sticky top bar appears with hamburger + brand. Tap hamburger → drawer slides in. Tap any nav item → drawer auto-closes. KPIs stack 2x2, clause review becomes stacked cards, every action bar wraps cleanly. |
| 15 | Back on desktop, click the sidebar **collapse arrow** | Sidebar shrinks to icons-only. Hover any nav item → tooltip with the label. State persists across refresh. |
| 16 | Approve Martina's row, change mind, click **Undo my approval** | Row reverts to pending. Audit trail captures "Withdrew approval". If she was the last pending approver, contract walks back from ready_to_send to awaiting_approval. |
| 17 | Open **Templates**, expand "Rogue templates detected in Drive" | 4 rogue files listed with similarity + recommended action. Click **Notify owner** on the SecureBank row → inline Slack DM preview shows Sara Lindberg as the recipient + the exact message body + production-mode notes. Click **Send DM** → green "sent" pill replaces the buttons. Click **Archive** on John's draft row → row dims, "rogue" badge becomes "archived", Undo pill appears. |
| 18 | Click **Reset demo data** in the sidebar | All in-session state (rogue actions, manually-added records, approvals, etc.) clears and re-seeds from the mock data. |

---

## 15. Trade-offs and what was deliberately cut

**Real cuts (Phase 2):**
- Real DocuSign API integration (replaced with envelope-preview modal showing exact JSON)
- Real Claude clause check (replaced with deterministic rules engine — same output shape)
- Real Slack notifications (replaced with `Slack DM sent to X` audit events)
- OAuth integrations for source systems (replaced with seeded mock records)
- Authentication / RBAC (single Martina persona)
- Counterparty redline portal
- Renewal + obligation tracking with calendar alerts
- Inbound vendor contracts
- Bulk Send / PowerForm flows
- Daily digest emails
- i18n

**Honest acknowledgements (audit-flagged but kept as Phase 2):**
- Specialty weights are constants in TS, not config-editable by Head of F&O
- Round-robin strategy named but implemented as deterministic-first-pick
- No load balancing on Legal (Anna gets all UK MSAs because UK specialty wins)
- No "rejection re-route" path beyond bouncing to owner
- Delegation source is a code constant, not a Calendar OOO integration
- Local-director slot defined in `signer-routing.ts` but only `group CEO` ever picked
- Zero formal unit-test coverage (engine smoke tests written + verified in dev, deleted)

**Engineered correctness wins (from the audit):**
- Role → individual is one engine, not three hardcoded copies
- Light-side signer is entity-aware (UK contract reads "Light Ltd" in audit)
- Governing law allow-list is one constant, not 4 inline copies
- Salary bands are jurisdiction-aware (UK Senior Eng @ 200k EUR correctly flagged)
- Channel collision picks most-restrictive (Email magic link > Slack DM > …)
- Template version pinned at create time + stale-version banner
- Board committee emits N approvals, `approve()` matches on `(role, userId)`

---

## 16. What I'd build next, in priority order

| # | Integration | Why |
|---|---|---|
| 1 | Slack (interactive Approve / Reject in DM) | Everyone is in Slack. Zero new tool to learn. The adoption gate. |
| 2 | **Light writeback (ledger / HRIS / cap table)** | The strategic extension. Built in parallel with Slack so the first signed contract has somewhere structured to land, not just Drive. Production depends on Light exposing the receiving endpoints; the prototype emits the shape. |
| 3 | Salesforce + HubSpot read | 30-50 contracts / month originate from Sales. |
| 4 | DocuSign API (real envelopes + Connect webhooks) | Replaces simulated send. Well-documented. Low risk. |
| 5 | HRIS read (Personio, Ashby, Workday) | 10-20 contracts / month from People Ops. |
| 6 | Drive / SharePoint template sync | Replaces ad-hoc folder. Required for version control + compliance. |
| 7 | Email magic links | Handles board, external counsel, non-Slack users. |
| 8 | Calendar alerts for renewals | Closes the loop on obligations. |
| 9 | Settings → Approvers UI | Closes the "Head of F&O owns this file" promise. |
| 10 | Postgres + S3 backend | Replaces localStorage. Multi-user real. |

Slack-first is for adoption; writeback at #2 is the strategic extension. In an actual rollout I would build the two in parallel.

---

## 17. Tech stack one-liner

Next.js 15 App Router · TypeScript strict · Tailwind 3.4 · React 19 · lucide-react · clsx · localStorage state machine · no backend.

Production stack would add: Postgres, S3, Redis (BullMQ), Vercel/AWS, Google SSO, OAuth per vendor, Slack Bolt, DocuSign REST v2.1, Drive Watch API.

---

## 18. Read order if you're new

1. `README.md` — five-minute orientation, build vs buy, demo flow
2. `docs/PROJECT.md` — this doc, full map
3. `docs/decisions.md` — the *why* behind every architectural call
4. `docs/architecture.md` — data flow + state machine
5. `lib/types.ts` — the contract for the codebase
6. `lib/contract-store.ts` — the operating core
7. `lib/routing-rules.ts` + `lib/approver-directory.ts` — the engine
8. Click around the app while reading

---

**End of project map.** Updated 2026-05-13.
