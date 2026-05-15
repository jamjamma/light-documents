# Light Documents

> Case study submission for the AI Strategy & Operations Associate role at Light (light.inc).
> Part 1: scope what to build or buy to fix Light's manual document workflow, and prototype the core.

| | |
|---|---|
| **Live demo** | https://light-documents-sigma.vercel.app/ |
| **In-app memo** (the fastest read) | [/about](https://light-documents-sigma.vercel.app/about) |
| **Repo** | https://github.com/jamjamma/light-documents |
| **Case Part 2** | [case-study/PART-2-COHORT-ANALYSIS.md](case-study/PART-2-COHORT-ANALYSIS.md) |
| **Case Part 3** | [case-study/PART-3-DAY-ONE.md](case-study/PART-3-DAY-ONE.md) |

---

## How to read this submission

Three reading depths. Pick the one that matches your time. The fastest route is the guided tour inside the live demo, which is built to save you the time of reading any of these documents.

| If you have | Open | What you get |
|---|---|---|
| 5 minutes | the [live demo](https://light-documents-sigma.vercel.app/) and let the **guided tour** run | The workflow in motion, with popovers explaining each piece. This is the fastest path; the tour exists specifically to save reading time. |
| 15 minutes | the [in-app About memo](https://light-documents-sigma.vercel.app/about), or this README top to bottom | Problem, reframe, value chain + friction map, how I approached it, build vs buy, the key decision, scope, 90-day roadmap, plus inline summaries of Parts 2 and 3 |
| 45 minutes (build-side) | [`docs/PROJECT.md`](docs/PROJECT.md) | Single-page map of the build: state machine, three logic engines, every module's purpose, every workflow branch (committee, PTO, undo, NDA exception), the cut list with reasoning |

The demo, the About page, and this README contain the same answer at three different levels of compression. PROJECT.md and the rest of `docs/` are for the reader who wants to see the engineering behind that answer.

## What's in this README

**Set the frame**

1. [The problem](#the-problem)
2. [The reframe](#the-reframe)

**Understand the workflow**

3. [The value chain and the friction map](#the-value-chain-and-the-friction-map)
4. [How I approached this](#how-i-approached-this)

**Decide what to build, what to buy, what to defer**

5. [Build vs buy](#build-vs-buy)
6. [The one key decision](#the-one-key-decision)
7. [Friction killed: before vs after](#friction-killed-before-vs-after)
8. [Why each piece exists (edge cases this build handles)](#why-each-piece-exists-edge-cases-this-build-handles)

**Limits and what comes next**

9. [What is real vs what is stubbed](#what-is-real-vs-what-is-stubbed)
10. [What I would build next (90 days)](#what-i-would-build-next-90-days)
11. [Stated assumptions](#stated-assumptions)

**The other case-study parts**

12. [Case study Part 2 (summary)](#case-study-part-2-summary)
13. [Case study Part 3 (summary)](#case-study-part-3-summary)

**Operations**

14. [How to run](#how-to-run)
15. [Where to read more (the build-side)](#where-to-read-more-the-build-side)

---

## The problem

The brief names two visible frictions:

- **Manual Word edits per contract.** Counterparty, value, payment terms, liability cap, indemnity, governing law, term, auto-renew, DPA flag, signer name + title + email, and more depending on document type. Volume of fields varies by template but every one is a place for a typo or a stale value.
- **Hand-placed DocuSign fields.** Signature, date, and initial blocks dragged into position per envelope, per signer, every time.

At Light's stated volume (50 to 100 contracts / month), that is a steady operational tax. Both frictions can be eliminated with the right workflow layer in between.

## The reframe

While rebuilding the flow, there is a strategic opportunity available to Light that other CLM vendors cannot match.

- **Commercial contracts carry structured data.** MSAs and Order Forms → revenue and billing. Employment → headcount and compensation. Warrants → cap table. Vendor → AP and obligation tracking.
- **NDAs are the exception.** No commercial value to post. They file for retention only. The audit trail is the system of record (see [decisions.md §14](docs/decisions.md)).
- **The writeback lands where Light has a receiver.** The prototype emits the structured payload on `envelope-completed`. Production wires it into whichever receivers Light operates or is building. The 90-day roadmap treats this as a parallel workstream, not a precondition.

The PDF is the audit artifact, the data is the product. That is the potential wedge, if Light wants to operationalise it.

---

## The value chain and the friction map

```
Source records                Master templates             Approver directory
(SF / HubSpot / Attio /       (Word docs in Drive,         (Legal, F&O, CFO, People,
 Personio / Ashby /            owned by Legal)              CEO, Board) with PTO
 Manual entry)                                              delegations
        │                              │                              │
        │ read                         │ read + version-pin           │ read
        ▼                              ▼                              ▼
    ┌─────────────────────────────────────────────────────────────────────┐
    │                       LIGHT DOCUMENTS                                │
    │                                                                      │
    │   intake  →  clause check  →  routing  →  approve  →  sign  →  file  │
    └────────┬──────────────┬───────────────┬──────────────┬───────────────┘
             │              │               │              │
             ▼              ▼               ▼              ▼
          Slack          DocuSign         Email          Writeback to
        (DM + ch)       (envelope)       magic          systems of record
                                         links          (where Light exposes
                                                         them; NDAs file for
                                                         retention only)
```

### Where friction actually lives

Friction is not in any single team. It lives at the **handoffs**. The build is shaped around fixing the worst ones first.

| Handoff | Who suffers today | What we eliminate |
|---|---|---|
| Sales → Legal (clause review) | AE waits days for a review; Legal re-reads the same MSA every week | Clause check runs at intake; only deviations route to Legal, with reasons attached |
| Legal → Finance (approval thresholds) | Approver chain assembled by Slack DM, sometimes the wrong person | Rule-based routing engine, owned by Head of F&O, deduplicates approvers by role and resolves channel collisions |
| Drafting → DocuSign (field placement) | Fields dragged into position per envelope, every time | Anchor tags placed once in the master, DocuSign places fields on every send |
| DocuSign → ledger / HRIS / cap table | RevOps re-keys MRR, People re-keys headcount, Finance re-keys vesting | Structured writeback on `envelope-completed`. Conditional on Light exposing the receiver. |
| Master template update mid-flow | In-flight contracts silently change shape | Version pinned at create time, stale banner when master updates |
| Board / external counsel signing | Outside-Slack approvers get lost | Email magic links with audit-grade access |

---

## How I approached this

The thinking pipeline that produced everything above and below.

| # | Step | What it produced |
|---|---|---|
| 1 | Read the brief and named the two visible frictions plainly | Two-line problem statement |
| 2 | Mapped the contract workflow end to end as a value chain (source → intake → check → route → approve → sign → file → writeback) | The diagram above |
| 3 | Located where pain lives at each handoff, not just inside any single team | The friction map above |
| 4 | Asked layer by layer: build, buy, or defer | [Build vs buy table](#build-vs-buy) |
| 5 | Walked the one key decision (wrap DocuSign, build the gap) with three reasons | [The one key decision](#the-one-key-decision) |
| 6 | Stress-tested the design against the awkward cases (committee approvals, PTO delegation, channel collision, entity-aware signers, NDA exception, undo before send) | [Why each piece exists](#why-each-piece-exists-edge-cases-this-build-handles) |

Steps 5 and 6 are where the design earned the right to be more than "build an uploader". Most of the surface in the prototype exists because one of those edge cases would have broken a simpler tool.

---

## Build vs buy

| Layer | Decision | Why |
|---|---|---|
| E-signature, identity, audit trail | **Buy / keep DocuSign** | eIDAS-compliant in EU, ESIGN in US, court-tested. Not our edge. |
| Template authoring | **Keep Word + Drive** | Legal will not adopt a new editor. We read templates from Drive, we do not host editing. |
| Full CLM (Ironclad, Juro, SpotDraft) | **Defer, not dismiss** | Juro and SpotDraft now target Series A SaaS in Europe with SMB pricing and ~30-day implementations. A pilot would cover ~70% of this workflow. The 30% they do not cover is what's interesting for Light: writeback into Light's systems of record, routing rules owned by Head of F&O, and integration with the source records Light's customers already trust. Revisit at 500+ contracts / month or when post-signature obligation tracking dominates. |
| Workflow layer (intake → check → route → envelope → writeback) | **Build** | The gap that simpler tools do not fill and the larger CLMs over-build. Sized for Light's volume today, designed so the most useful part of it (the writeback shape) can be lifted into Light's product later. |

## The one key decision

**Wrap DocuSign as infrastructure. Make contracts first-class structured data, not files.**

Three reasons:

1. **Legal.** Rebuilding the signing layer means inheriting eIDAS, ESIGN, UETA, authority-to-bind verification, witnessing rules, and a decade of case-law compliance. Wrong battle for a Series A finance company.
2. **Adoption.** Counsel writes contracts in Word. Forcing them into a new editor kills the rollout. We read what they write; we do not replace where they write.
3. **Strategic fit.** For the contract types that carry commercial data, the structured payload belongs in the systems of record. The PDF is the audit artifact. NDAs file for retention only (see the NDA carve-out in [docs/decisions.md](docs/decisions.md)). This is the approach that matches Light's product thesis without overclaiming.

Smallest technical embodiment: DocuSign anchor tags embedded in templates as white-on-white text, paired with typed variables. Collapses "manually drag signature fields" to zero, deterministically, by doing the work once in the master template instead of per envelope. No signing code written.

---

## Friction killed: before vs after

| Friction today | With Light Documents |
|---|---|
| Multiple fields hand-edited in Word per contract | Exceptions only; the rest is prefilled from source records |
| Fields dragged into position per envelope, every time | Anchor tags placed once in the master, DocuSign places fields on every send |
| Approval chasing over Slack DMs and email | Rule-triggered routing, with reasons attached to every approval |
| Wrong template version risk | Version pinned at create time, stale banner when master updates |
| Manual ledger entry by RevOps after signing | Structured writeback on `envelope-completed` (conditional on Light exposing the receiver) |
| Lost contracts in inboxes | Single state machine, audit trail, dashboard with "Awaiting me" / "Blocked" |

---

<a id="why-each-piece-exists"></a>

## Why each piece exists (edge cases this build handles)

The prototype has more surface than a "build an uploader" answer would. Each of these is here because a simpler tool tends to break at exactly that edge.

| Surface | Edge case it handles |
|---|---|
| Committee emission + PTO delegation | Board flows have multiple members, one is usually away. Simpler tools either block the whole chain or silently drop a vote. |
| Channel-collision tiebreaking | A single contract can fire four rules disagreeing on notification channel. Without resolution, the same approver gets double-DM'd. |
| Template version pinning | Counsel updating MSA v4.2 to v4.3 mid-flow must not silently change in-flight contracts. |
| Entity-aware signer routing | A Light Ltd (UK) contract signed as "Light ApS CEO" would fail UK Companies House scrutiny. |
| NDA exception to the writeback rule | NDAs have no commercial value to post; the audit trail is the system of record. The general rule: when a strategic claim is type-conditional, the catch-all path in code must be explicit, not a fallthrough. See [decisions.md §14](docs/decisions.md). |
| Undo my approval (before send) | An operator approves, changes their mind, withdraws while the envelope is still in our hands. Refused once DocuSign has it. |

Everything else was deliberately cut. See [`docs/decisions.md §15`](docs/decisions.md) for the full cut list with reasoning.

---

## What is real vs what is stubbed

Every stubbed piece carries an explicit "Demo:" callout in the UI where it appears.

| Layer | Real in this prototype | Stubbed for the demo |
|---|---|---|
| Workflow engine | Next.js routing + state machine with explicit valid transitions + immutable updates | None |
| Clause checker | Deterministic typed rules engine over `ClauseRule[]`. Output shape is what Claude will return in production. | Claude API (one-file swap) |
| Routing engine | 13 typed rules + `computeRouting()` with channel collision + committee logic | None |
| Approver directory | Group + specialty matching + active PTO delegations | Settings UI for editing groups |
| DocuSign send | Real envelope JSON shown in the preview modal | DocuSign REST API call (Connect webhooks for receive) |
| Slack notifications | Audit-trail events with realistic message bodies + recipient routing logic | `chat.postMessage` with interactive buttons |
| Writeback | Structured payload generated per document type at envelope completion | HTTP POST to Light's receivers (depends on Light side) |
| Persistence | localStorage with versioned schema, immutable updates, Reset-demo button | Postgres + S3 + Redis |

### Where Claude lives in production

Claude (Sonnet) reads the negotiated draft, compares clause-by-clause against the pinned master, and returns a structured `ClauseCheckResult[]` with rationale per deviation. The UI binds to that shape, so swapping the engine is a one-file change.

**Routing stays rule-based even with Claude in the loop.** Claude proposes deviations; deterministic rules decide who approves. That separation is what keeps the system auditable to Finance.

The prototype ships the deterministic engine for two reasons: the demo runs without an API key or per-run cost, and reviewers can trace every flag to a typed `ClauseRule` rather than an opaque LLM call.

---

## What I would build next (90 days)

| Order | Integration | Why first |
|---|---|---|
| 1 | Slack (interactive approvals via DM) | Everyone is in Slack. Zero new tool to learn. The adoption gate. |
| 2 | **Light writeback (where endpoints exist)** | The strategic extension. Built in parallel with Slack so the first signed contract has somewhere structured to land, not just Drive. Operational reach depends on which Light endpoints are ready. |
| 3 | Salesforce + HubSpot deal read | 30 to 50 contracts / month originate from Sales. |
| 4 | DocuSign API (real envelopes + Connect webhooks) | Replaces simulated send. Well-documented API. Low risk. |
| 5 | HRIS read (Personio, Ashby, Workday) | 10 to 20 contracts / month from People Ops. |
| 6 | Drive / SharePoint template sync | Replaces ad-hoc folder. Required for version control + compliance. |
| 7 | Email magic links | Handles board, external counsel, non-Slack users. |
| 8 | Calendar alerts for renewals | Closes the loop on obligations. |

Slack-first is for adoption. The writeback at #2 is the strategic extension, parallel rather than sequential, so the first signed contract has somewhere structured to land on day one. Anything writeback-dependent gracefully falls back to Drive filing + audit trail until the receiver exists.

---

## Stated assumptions

These are the assumptions this answer is built on. They are worth flagging because they would be the first questions in a week-one 1-1.

1. Light has master Word templates in Drive (or SharePoint) owned by Legal and People, not yet connected to source systems.
2. DocuSign is the existing signing tool, with partial template / AutoPlace usage but inconsistent practice.
3. Source data lives in Salesforce or HubSpot (deals), an HRIS (employees), and Light's own internal systems (vendors, cap table).
4. Approvers are real humans on Slack. Routing rules are owned by Head of Finance & Ops.
5. Volume is the stated 50 to 100 contracts / month. CLM-scale tools are overkill for this throughput today.
6. Light operates three legal entities (assumed): Light ApS (Denmark, primary), Light Ltd (UK, post-Brexit), Light Inc. (US Delaware, for US expansion). Realistic Series A structure for a Danish-headquartered SaaS company. Would verify with Head of F&O in week one.
7. The writeback target (Light ledger / HRIS / cap table) exposes a receiver, or is on the near roadmap. If not, this build still removes the upstream friction and the structured payload waits at the gate.

---

## Case study Part 2 (summary)

The full analysis lives at [case-study/PART-2-COHORT-ANALYSIS.md](case-study/PART-2-COHORT-ANALYSIS.md). Headline answers:

- **Blended 12-month NRR (revenue-weighted, Q1 + Q2 2024): 127.9%.** Directional only; the sample is two mature cohorts.
- **Two expansion phases are diverging.** Mid-cycle (M3 → M6) has collapsed from +9pp to +2pp across four cohorts. Late-cycle is renewal-driven: Q1 2024 is flat from M9 to M12 then jumps to 147.3% by M18.
- **What that means.** Some of the apparent cohort decay is a real expansion-engine problem. Some is structural (newer cohorts have not reached their renewal moment yet). The headline NRR averages both, hiding both.
- **What to investigate first.** Pull contract structure for Q1 and Q2 2024 to test whether stronger ramp / renewal terms explain the M18 jump. Track Q2 2024 through M18 to see whether the late-cycle event repeats.
- **ARR sensitivity.** A 10pp M6 uplift on the two pre-M6 cohorts adds **$268k to $344k of incremental M18 ARR** (persistence to trajectory). Across all pre-M18 cohorts the range is $552k to $710k. The trajectory case is an upper bound because Q1 2024's M6→M18 ratio is inflated by what looks like a renewal-cycle event.

## Case study Part 3 (summary)

The full version lives at [case-study/PART-3-DAY-ONE.md](case-study/PART-3-DAY-ONE.md). Headline answers:

- **The 1-1 with Martina is the deliverable.** The week before it is for arriving with one position worth her time, and for not asking her what I could have found out on my own.
- **Three lenses, read in parallel.** Lens 1, what is actually happening on the ground (internal comms, customer calls, support, the real ARR roster). Lens 2, what leadership says should be happening (strategy docs, all-hands, Martina's last update). Lens 3, how the outside sees Light (publicly available investor framing, Jonathan's public talks, adjacent battles). The analytical value sits in the gaps between them.
- **I would map people to handoffs, not titles.** The other F&O person, deployment / CS, one AE, one ledger engineer, one legal. Sit in on a deployment standup, one customer kickoff, one month-end close. Not Jonathan; he should not pay the tax of a week-one chat.
- **The one point of view I would bring.** Find the handoffs, not the loudest pain. The internal practice is product research (Linear runs on Linear, Lovable on Lovable). Earn the right to bigger opinions later. What I want from the 1-1 is for Martina to tell me where this is wrong.

---

## How to run

```bash
cd ~/Desktop/claude/Projects/light-documents
npm install
npm run dev
# open http://localhost:3000
```

Requires Node 20+. No env vars, no auth, no database. State persists in localStorage. Reset demo data anytime via the sidebar button.

Tech stack: Next.js 15 App Router, TypeScript strict, Tailwind 3.4, lucide-react, clsx, React 19. localStorage state machine with immutable updates. No backend in this prototype.

For production: Postgres for contracts and templates, S3 / GCS for signed PDFs, Redis for queues, Vercel or AWS for hosting, SSO via Google Workspace or Okta, OAuth integrations per source system.

---

## Where to read more (the build-side)

If you want to look under the hood, `docs/PROJECT.md` is the single-page map of the build. The rest of `docs/` is split per concern.

| File | What's in it |
|---|---|
| [`docs/PROJECT.md`](docs/PROJECT.md) | Full project map: state machine, three logic engines, every module, every workflow branch, the cut list |
| [`docs/decisions.md`](docs/decisions.md) | 15 architectural decision records with alternatives considered |
| [`docs/architecture.md`](docs/architecture.md) | Data flow, state model, per-engine deep dive, production architecture |
| [`docs/features.md`](docs/features.md) | Per-doc-type "manual editing kill matrix" (NDA, MSA, Employment, Warrant, Order Form, Pilot) |
| [`docs/cross-functional.md`](docs/cross-functional.md) | Persona × action matrix, end-to-end walkthrough by name, RBAC, failure modes |
| [`docs/demo-script.md`](docs/demo-script.md) | 5-minute Loom narration script |

---

## License + attribution

Built by James Hwang for a case study submission at Light. Single-author, single-session prototype. No production secrets, no proprietary code, mock data only.
