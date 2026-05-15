# Light Documents — QA Findings, 2026-05-15

Static / code-driven sweep against the 7-phase QA plan. The interactive phases
(1, 2, 4, 7) require browser walking and are listed as a separate checklist at
the bottom for the human reviewer.

## Status update 2026-05-15 (post-fix pass)

B1, B2, B3, B4, B5 are all addressed in the post-audit commit sequence.
Additional bugs caught by the Claude Desktop browser walk and verified against
code:

- Bolt MSA envelope-preview hardcoded "Acme MSA" filename label
  (DocuSignPreviewModal.tsx:254). Fixed: now `{contract.name}`.
- Intake step 3 copy named Personio but the customer-template tab strip shows
  Attio. Fixed in tour-steps.ts.
- "Counsel" role rename pushed through `ApproverRole` enum, routing rules,
  audit events, IntakeForm warnings, and policy-config comments.
  Function-references to "Legal team" left alone (template ownership, anchor-
  tag authorship, edit-access labels). One stray "Legal" in
  mock-data.ts:19 (`ownerTeam: "Legal"`) intentionally retained because the
  Template `ownerTeam` field surfaces as "Owner team" in the template detail
  modal, which refers to the function not the role.
- Tour outside-click no longer dismisses (allowClose: false). Esc + X +
  Forward/Back still work as exits.
- Intake step 9 of 11 title changed from "Tour complete" (misleading, two more
  steps follow) to "That's the workflow".

Original B1-B5 findings retained below for record. Strike-throughs added where
the live deploy moved ahead of this audit.

## Pre-flight (Phase 0)

| Check | Result |
|---|---|
| `git status` | 5 uncommitted edits, all doc-only (README, About, decisions, PROJECT, Part 3) |
| Latest commit | `17beb2f fix(tour): align slack-preview popover to right edge` |
| `npm run build` | Green. 8 routes. Largest bundle: `/contracts/[id]` 21.6 kB → 161 kB First Load |
| Route sizes | No route > 162 kB First Load. Within budget |
| Tour-steps.ts churn (7d) | **30+ commits** touching `lib/tour-steps.ts`. Stability flag confirmed |
| Tour shape | 76 steps across 6 chapters (dashboard 7, workflow 19, signed 12, archive 5, templates 22, intake 11) |

## Confirmed bugs (fix before ship)

### ~~B1~~ FIXED — Routing-rules off-by-one, tour step `routing`
- **Location:** [lib/tour-steps.ts:342](lib/tour-steps.ts#L342)
- **Says:** "Bolt triggers 3 of **13** rules:"
- **Truth:** `ROUTING_RULES` in [lib/routing-rules.ts](lib/routing-rules.ts) has **14** entries (verified by parser).
- **Severity:** HIGH. The QA plan singles out off-by-one KPI/count drift as a "submission-killer." This number is plainly verifiable in the same file the operator is being walked through.
- **Suggested fix:** `<p>Bolt triggers 3 of 14 rules:</p>` (or, better, derive at render time from `ROUTING_RULES.length` so it never drifts again).

### ~~B2~~ FIXED — Templates chapter duration estimate
- **Location:** [lib/tour-steps.ts:1729](lib/tour-steps.ts#L1729) (`CHAPTERS` array)
- **Says:** templates `estSeconds: 90` (1.5 minutes for 22 steps = 4 s / step)
- **Truth:** Templates chapter contains a 7-step modal walk + 8-step rogue panel walk + 4-step catalog grouping + an intake handoff. The QA plan estimates "~9 min if walking the whole thing" which is honest. 90 s is ~6x optimistic.
- **Severity:** MEDIUM. Operator reads the chapter chooser, picks Templates expecting 90 s, finds it took 5-7 minutes. Reads as "the build's numbers are vibes, not data" — same trust hit as B1.
- **Suggested fix:** Bump to `estSeconds: 360` (6 minutes, conservative) or `420`. Same `formatTotalTourDuration()` will roll up. Verify dashboard chapter chooser still reads cleanly.

### ~~B3~~ FIXED — Terminology inconsistency: "Counsel" vs "legal" in KPI tile copy
- **Location:** [lib/tour-steps.ts:207](lib/tour-steps.ts#L207) — `"In review. Clause check or legal."` (lowercase noun)
- **Sibling:** [lib/tour-steps.ts:290](lib/tour-steps.ts#L290) — `"Clause checker or counsel actively reviewing."` (lowercase)
- **Routing step:** [lib/tour-steps.ts:344](lib/tour-steps.ts#L344) — `"<strong>Legal.</strong> Clause deviations."` (uppercase, used as the role label)
- **SESSION-HANDOFF** Tier 1 sweep called for "Counsel" everywhere except where "Legal" is a role label.
- **Severity:** LOW-MEDIUM. The "In review" tile copy was missed by the sweep. The next reviewer will spot this on the first hover.
- **Suggested fix:** `"In review. Clause check or Counsel."` (capital, consistent with the role).

### B4 — `docs/PROJECT.md` step-17 instruction describes a stale demo path
- **Location:** [docs/PROJECT.md:492](docs/PROJECT.md#L492) — `"Click **Notify owner** on the SecureBank row → inline Slack DM preview shows **Sara Lindberg** as the recipient"`
- **Truth:** The tour walks Notify on the **first** row (John's draft) because that's where `.tour-anchor-rogue-notify-button` lives. John left the company, so the routing falls back to the `#sales-ops` channel — not to Sara Lindberg. SecureBank (Sara's row) is a different rogue file with a different demo behaviour.
- **Severity:** LOW. PROJECT.md is internal-facing docs, not a user-visible surface, but it's wrong in a way that surfaces if a reviewer follows the demo script and gets a different result.
- **Suggested fix:** Either reword to "Click Notify owner on the first row (John's draft) → Slack preview routes to the `#sales-ops` channel because John left the company" *or* anchor `.tour-anchor-rogue-notify-button` on the SecureBank row so the doc and the tour agree.

### B5 — `tour-steps.ts` JSDoc references stale step counts
- **Location:** [lib/tour-steps.ts:1492](lib/tour-steps.ts#L1492) — `"walks all 33 steps end-to-end"` (truth: 76)
- **Sibling:** [lib/tour-steps.ts:1772](lib/tour-steps.ts#L1772) — `"rather than facing the full 60-step total"` (truth: 76)
- **Severity:** LOW. Comments only, not user-visible. Still worth fixing because they make the next maintainer wrong by 50%.
- **Suggested fix:** Replace fixed numbers with `TOUR_STEPS.length` in comment text, or just delete the count.

## Audits that passed

### Terminology audit (Phase 3.1)

| Term | Status | Notes |
|---|---|---|
| Counsel vs Legal | **MIX (see B3)** | "Counsel" is the canon. One stray "legal" in [tour-steps.ts:207](lib/tour-steps.ts#L207). 88 hits scanned. |
| Master template vs master | **CONSISTENT** | "master template" / "master Word docs" / "master" all used in compatible senses. |
| Approval chain vs routing | **CONSISTENT** | "approval chain" = the rendered list of approvers; "routing rules" = the engine that builds it. One stray "approval routing" in [RogueTemplatesPanel.tsx:166](components/RogueTemplatesPanel.tsx#L166) inside a Slack-message draft. Acceptable. |
| Clause check vs clause diff | **CONSISTENT** | "Clause checker" = the panel; "clause check" = the event; "deviations" = the noun. |
| Signed contract vs signed record vs filed | **MIX, acceptable** | Three terms in active use: "Signed contracts" (sidebar label, page title), "signed record" (page-internal title and audit event), "Filed" (stage badge). Each has a clean job. Worth glossary-locking but not a bug. |
| Operator vs Martina vs Head of F&O | **CONSISTENT** | "Head of Finance & Ops" = role title (formal); "Head of F&O" = short form; "Martina Holst" = the named operator persona. Used in the right places. |

### Number audit (Phase 3.2)

Ground-truth counts from `lib/mock-data.ts`:

| Entity | Code truth | All claim surfaces match? |
|---|---|---|
| Templates | **8** (TEMPLATES.length) | YES — README, About, tour, PROJECT, architecture all say 8 |
| Source records | **14** (SOURCE_RECORDS.length) | YES — PROJECT.md, SESSION-HANDOFF say 14 |
| Seed contracts | **14** (10 in-flight + 4 filed, verified by parsing stages) | YES |
| Rogue templates | **4** (ROGUE_TEMPLATES.length) | YES |
| Light entities | **3** (LIGHT_ENTITIES = DK / UK / US) | YES — About page says "3 Light entities (assumed)" |
| Routing rules | **14** (ROUTING_RULES.length) | **NO — see B1** |
| Tour steps | **76** | Code comments still say 33 / 60 — see B5 |

The plan's `"21 (or 22?) templates — your recent screenshot says 20 of 22"` claim does not match the codebase. There are 8 master templates + 4 rogue files; no surface renders "22". This is a stale plan reference, not a build bug.

### Polish layer (Phase 6)

| Check | Result |
|---|---|
| Em-dash / en-dash in user-visible prose | **CLEAN.** All hits are either: (a) single-char `—` placeholder for empty data cells (allowed per project rule and SESSION-HANDOFF.md:184); (b) inside code comments (TourController, contract page). |
| `console.log` / `console.debug` / `debugger` in [lib/](lib/), [app/](app/), [components/](components/) | **CLEAN.** Zero hits in source. (Did not check `node_modules` or `.next`.) |
| TypeScript build | **GREEN.** Static page generation 8/8 OK. |

### Honesty pass on uncommitted edits

The 5 uncommitted files are all honesty-direction polish, not regressions:

- **README.md:** Drops fabricated "~15-20 fields per MSA / 5-10 minutes dragging" estimates that nobody can verify. Replaces with a concrete enumeration of field types and "every one is a place for a typo or a stale value." Net honesty win.
- **app/about/page.tsx:** Adds "Also on GitHub" link card at top. Removes color tones from build-vs-buy table rows (now monochrome, less marketing-flavored). "lawyers" → "legal team". Sound.
- **docs/decisions.md, docs/PROJECT.md:** Replace stale `(ADR 14)` / `(ADR 2)` references — the file no longer numbers ADRs — with in-document anchors (`§14 below`, `§2 above`, or "see the NDA carve-out"). Sound.
- **case-study/PART-3-DAY-ONE.md:** Replaces `"Atomico / Balderton memos"` (implies insider access) with `"publicly available investor framing"`. Replaces `"Loom"` with `"internal video"`. Restructures 1-1 list into a labeled table with handoff column. Net honesty + readability win.

All five are ready to commit when you're ready. None introduce drift.

## Notable narrative reads (Phase 3.5)

Read-throughs across README, About page, ADRs, Part 2, and Part 3:

- The reframe lands in the same shape at every layer. About page §1, README "The problem, and the reframe", and ADR §1 all say: stated frictions are real and the workflow kills them, while we're in the gap there's a bigger systems-of-record writeback prize.
- The build-vs-buy table now reads honestly: "Defer, not dismiss" on full CLM with a Juro/SpotDraft callout, not a 2022 "too heavy" dismissal.
- Counsel-never-logs-in overclaim has been swept correctly. "Counsel doesn't author contracts inside Light Documents" with the explicit "what stays out is authoring, not review" clarification appears in README + About + tour step `templates-counsel` (line 1124).
- Tier-2 NRR / cohort claims in Part 2 are stated as "directional only; the sample is two mature cohorts." Honest framing for what is essentially mock data.

No contradictions caught between layers.

## What I could not verify (handoff to interactive walker)

Phases 1, 2, 4, 7 of the plan need a browser. Use the live link
https://light-documents-sigma.vercel.app/ in incognito + already-toured profiles.
The following are the highest-value checks from the plan, reduced to a tight
walkthrough:

### Cold-start sanity (Phase 1)
- [ ] Within 5 seconds of dashboard load: what / what action / who is Martina answerable without scrolling?
- [ ] Every sidebar label is a noun a non-technical reader would recognise. Flag any: "ICM", "v2", "scheme".
- [ ] KPI numbers match the list below (no off-by-one).

### Tour walk — chapter by chapter (Phase 2)
- [ ] **Chapter 2, routing step:** popover now reads "3 of 14 rules" after B1 fix.
- [ ] **Chapter 2, reassign modal walk (4 steps):** each anchor lands inside the modal; Back closes modal; Forward exits and re-anchors on operator row.
- [ ] **Chapter 2, modal-pagenav:** popover below the nav, document preview visible above.
- [ ] **Chapter 2, modal-send:** popover sits above the Send button with right-edge alignment; arrow points at button.
- [ ] **Chapter 3 audit-trail (8 events):** order is Created → Clause check → Routed → Notification → Approved → Sent → Completed → Filed. Each event-step anchor wraps the right `data-event-kind` row.
- [ ] **Chapter 5, templates-detail walk (7 steps):** each modal anchor scrolls into view inside `max-h-[70vh]`.
- [ ] **Chapter 5, rogue panel slack-preview step:** popover sits bottom-right of preview, arrow points at Cancel / Send post.
- [ ] **Chapter 5, archive button → undo-archive → notify → slack preview → after-notify:** each auto-advance fires correctly; no orphan popover after row revert / send.
- [ ] **Chapter 6, intake-after-send:** popover anchored on `.tour-anchor-contract-actions` (whole bar), not just Preview envelope.

### Edge cases (Phase 4)
- [ ] Reset demo data mid-tour: tour aborts cleanly or restarts cleanly.
- [ ] Two tabs running the tour: no localStorage thrash (tour-state / tour-seen / tour-dismissed / tour-chapters-done / tour-chapter-progress / tour-all-progress — 6 keys).
- [ ] Clear localStorage mid-tour + refresh: tour restarts from `welcome`, no crash.
- [ ] Resume after closing tab: clicking Resume in the chapter chooser lands on the right step + re-establishes modal state.
- [ ] Narrow viewport 1024×768: no popover spills off-screen.
- [ ] Refresh while a modal is open: tour state persists; modal re-opens or step skips cleanly.

### Final smoke (Phase 7)
- [ ] Vercel deploy green for the merged-after-fixes commit hash.
- [ ] Time the full tour end-to-end; record in SESSION-HANDOFF. (Plan estimate after B2 fix: ~12-15 min.)
- [ ] Update README's "last verified" date and commit hash.

## Suggested commit order

1. Commit the 5 in-flight doc edits (README / About / decisions / PROJECT / Part-3) as the "honesty polish" commit. They're a coherent set.
2. Fix B1 (routing-rules count) and B3 (Counsel KPI tile copy) as a tight `fix(tour): off-by-one + Counsel terminology` commit.
3. Fix B2 (templates chapter duration) as `fix(tour): templates chapter duration is ~6m, not 90s`.
4. Optional: B4 (PROJECT.md step-17) and B5 (stale step-count comments).
5. Interactive walk → spot any browser-only bugs → commit + re-deploy.
6. Tag the deploy in SESSION-HANDOFF.md under a new "QA pass 2026-05-15" section.
