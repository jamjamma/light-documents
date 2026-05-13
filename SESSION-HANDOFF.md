# Light Documents: Session Handoff

> Current-state snapshot. If you're resuming this build in a new session,
> start here, then jump to `docs/PROJECT.md` for the full map.

## Status

**Demo-ready.** Live at https://light-documents-sigma.vercel.app/. Local dev
runs with `npm run dev`. Build is green, no console errors, no horizontal
overflow at iPhone 14 Pro width.

- 7 templates (NDA, MSA, MSA Pilot, Order Form, Employment DK, Employment UK, Warrant, Advisor Warrant).
- 11 in-flight + 4 signed seed contracts spanning every dashboard filter.
- 8 routes, all 200, typecheck clean, production build clean.
- `STATE_VERSION = 7`. localStorage shape: `{version, contracts, manualSourceRecords?, rogueActions?, seededAt}`.

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

The About page has a dedicated **"A note on the names in this demo"**
section listing every persona (Sara Friis, Martina Holst, Tom Bauer, Sara
Lindberg, Anna Lind, Plesner, Pia Andersen, Astrid Sjöberg, Christian Bek,
Emma Holloway) as illustrative. The Templates intro and the
"How the Legal team keeps Word" callout both reference Sara Friis with
explicit "illustrated in this demo by…" framing.

The "Legal keeps Word, not us" callout on About explains the cryptic
earlier line "The Legal team never logs into our tool" in plain English.

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
│   ├── contract-store.ts             # STATE_VERSION = 7; rogue actions + undo approval
│   ├── mock-data.ts
│   └── format.ts
├── docs/
│   ├── PROJECT.md                    # full map
│   ├── architecture.md, features.md, decisions.md, cross-functional.md, demo-script.md
└── case-study/
    ├── PART-2-COHORT-ANALYSIS.md
    └── PART-3-DAY-ONE.md
```

## Templates (7)

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
| All in-flight | 11 |
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
deployed at https://light-documents-sigma.vercel.app/. STATE_VERSION = 7.

Hard constraints: no em-dashes or en-dashes in user-visible copy, no
fabricated config / API references, every stub carries a "Demo:" callout.
Auto mode: execute autonomously.
```
