# Features

This doc walks through every feature: what it is, why it exists, how it works, and what is real vs stubbed.

> **Note on volumes and field counts below.** The case study brief states 50 to 100 contracts per month in total. The per-template volume splits and per-template field counts in this doc are illustrative estimates used to shape the build, not figures from Light. The variable lists themselves (Counterparty, value, payment terms, etc.) are template-design facts about what each document type typically contains, and would not change with a different volume profile.

## How the manual editing friction is killed, by document type

The case study calls out two specific frictions: "manually edited in Word" and "fields highlighted by hand." Both are solved per document type as follows.

### NDA (Mutual Non-Disclosure)

**What was manually edited today:**
- Counterparty legal name, signer name + email, effective date
- Jurisdiction tweaks (Denmark, UK, EU member state)
- Light entity (ApS, Ltd, Inc)

**Volume:** ~15 / month split between Recruiters (candidates) and AEs (prospects).

**How our system eliminates it:**

| Variable | Source |
|---|---|
| Counterparty name + signer | Salesforce, HubSpot, Attio deal record OR Personio, Ashby candidate record OR Manual entry |
| Effective date | Defaults to today |
| Light entity | Inferred from counterparty country (EU → Light ApS, UK → Light Ltd, US → Light Inc.) |
| Jurisdiction | Inferred from Light entity |

**DocuSign features used:** AutoPlace (4 anchor tags), parallel signing, day-3-7 reminders, **PowerForm capability** (self-serve signing link for recruitment funnels and conferences).

### MSA (Master Services Agreement)

**What was manually edited today:** Counterparty, value, payment terms, liability cap, indemnity, governing law, term, auto-renew, DPA flag, signer name + title + email. Each is a place for a typo or a stale value.

**Volume:** ~30-50 / month from Sales.

**How our system eliminates it:**

| Variable | Source |
|---|---|
| Counterparty, signer, value | Salesforce or HubSpot deal record |
| Payment terms, liability, indemnity | Defaults from Light's master MSA. Non-standard flagged. |
| Governing law | Defaults from Light entity (Light ApS → Denmark, Light Ltd → England and Wales, Light Inc. → Delaware) |
| Effective date | From deal close date |
| DPA flag | Defaults on (most customers require) |
| SLA tier | Standard 99.5%. Higher tiers via Service Level Exhibit. |

**Conditional sections attached automatically:**
- Service Level Exhibit (Exhibit A), always
- Data Processing Agreement (Exhibit B), when DPA required
- eIDAS QES identity verification, applied as **Light signing policy** when ARR ≥ €100k and EU governing law (not a legal requirement on every EU MSA; see policy note below)

**DocuSign features used:** AutoPlace (8 anchor tags), sequential signing (counterparty first), 30-day expiry, day-3-7-14 reminders, Identify (AES) for standard EU contracts, QES on high-value EU contracts per Light policy.

> **Policy note on QES.** Standard B2B SaaS MSAs do not require QES under eIDAS. Light's policy applies QES to high-value EU contracts because it materially strengthens evidential weight in an EU court if a dispute arises later. This is a company decision, not a legal mandate, and is owned by Head of F&O alongside the routing rules.

### Employment Contract (Denmark)

**What was manually edited today:** the most variable-heavy template by design.

Candidate name, role, base salary, variable %, start date, manager, probation, notice period, work location, equity bps, vesting, sign-on bonus, relocation, conditional sections (commission plan, IP assignment, non-compete).

**Volume:** ~10-20 / month from People Ops.

**How our system eliminates it:**

| Variable | Source |
|---|---|
| Candidate, role, manager, start date, location | Personio, Ashby, or Workday candidate record |
| Base salary | Typed into ATS by recruiter once verbal accept secured |
| Variable %, equity bps, sign-on | Typed by recruiter (negotiation outcomes) |
| Probation, notice, holidays | Defaults from Light's HR config (3 mo, 1 mo, 25+5 days for DK) |
| Working hours | Defaults 37 hours (Danish standard) |
| Equity strike price | Calculated from cap table system (Carta, Pulley) latest 409A |
| Number of options | Calculated from basis points × fully-diluted shares |

**Conditional sections attached automatically:**
- Commission Plan Exhibit, when role matches /sales|account|revenue/
- IP Assignment Addendum, when role matches /engineer|product|design|research/
- Equity Grant Addendum, when equityBps > 0
- Non-compete Addendum, when role matches /vp|director|head of|chief/

**DocuSign features used:** AutoPlace (6 anchor tags + per-page initials), sequential signing (candidate first, then CEO), 7-day expiry, day-2-5 reminders, **SMS / phone identity verification** for the candidate.

### Warrant Agreement

**What was manually edited today:** stakeholder name + address + tax residency, warrant percentage, exercise price (from latest 409A), vesting + cliff, acceleration triggers, board resolution reference, effective date, transfer restrictions.

**Volume:** 1-5 / month from CFO + outside counsel.

**How our system eliminates it:**

| Variable | Source |
|---|---|
| Stakeholder name, address, tax residency | Cap table system (Carta, Pulley, Ledgy) OR Manual entry |
| Warrant percentage / number | CFO types one, system computes the other from latest cap table |
| Exercise price | Pulled from cap table system latest 409A |
| Vesting + cliff | Defaults 48 / 12 months. CFO can override per stakeholder. |
| Board resolution reference | Typed by CFO. **System enforces presence with severity = block.** |

**Conditional sections attached automatically:**
- Board Resolution (Exhibit A), always
- Latest 409A Valuation (Exhibit B), always
- Acceleration Addendum, when applicable

**DocuSign features used:** AutoPlace (8 anchor tags including witness), sequential signing, **eIDAS QES applied per Light policy for all warrants** (warrants are high-value equity instruments; policy escalates to QES regardless of jurisdiction), **witness signer as third recipient**, 30-day expiry, day-7-14 reminders.

### Order Form (commercial companion to MSA)

**What was manually edited today:** customer name + signer, seat count, unit price, billing period, MSA reference, special pricing notes.

**Volume:** ~15-25 / month (renewals + expansions; outweighs new MSAs once a customer base exists).

**How our system eliminates it:**

| Variable | Source |
|---|---|
| Customer name + signer | Pulled from the linked MSA record |
| Seats, unit price, billing period | Salesforce Opportunity fields |
| MSA reference (required at clause-check time) | Picked from the customer's signed MSA record on file |
| Effective date, term | Inherits from the parent MSA |
| ARR amount (for routing) | Computed from seats × unit price × 12 |

**Routing fires automatically based on the computed ARR:** Head of F&O above €50k, CFO above €100k. The Order Form is the doc where the dollars actually move, so it benefits the most from the rules engine.

**DocuSign features used:** AutoPlace (4 anchor tags), parallel signing, 14-day expiry, day-3-7 reminders, links back to the parent MSA's envelope so finance can trace the lineage.

### Pilot MSA (3-month POC variant)

**What was manually edited today:** customer name + signer, pilot scope, success criteria, conversion-to-standard-MSA terms.

**Volume:** ~5-10 / month (Series A growth stage means lots of pilots).

**How our system eliminates it:**

| Variable | Source |
|---|---|
| Customer name + signer | Salesforce / HubSpot deal record |
| Pilot scope | Salesforce custom field "Pilot Scope" |
| Success criteria | Salesforce custom field "Success Criteria" |
| Conversion terms | Defaults from Pilot template (auto-renew off, capped fee, mutual exit) |

**Why this is a distinct template, not a flag on the standard MSA:** Pilot terms are materially weaker (mutual exit, no auto-renew, no indemnity above pilot fee). Counsel wants a separate document so a pilot can never be confused with a standard customer agreement at audit time.

**DocuSign features used:** AutoPlace (5 anchor tags), sequential signing, 7-day expiry (short pilot urgency), day-3 reminder only.

## How the manual DocuSign field placement friction is killed

For every document type, the same mechanism:

1. **Counsel embeds anchor tags ONCE in the master template** as white-on-white text (invisible to signer). Each template defines its own anchor convention (see Templates page in app for the full list per template).
2. **At send time, our system calls DocuSign with `anchorString` tabs** that match each anchor tag.
3. **DocuSign scans the doc, finds the anchors, places the fields automatically.** Zero manual dragging.
4. **Anchors move with text reflow.** Unlike absolute (x,y) positioning, anchors are immune to layout changes.

## Cross-functional surface

| Persona | Triggers | Reviews | Approves | Signs | Where they work |
|---|---|---|---|---|---|
| AE / Sales rep | Generate contract from Salesforce / HubSpot | own drafts |, |, | Salesforce + Slack |
| Recruiter | Generate offer from Personio / Ashby | own drafts |, |, | ATS + Slack |
| Head of People |, | All employment | Above-band exceptions |, | Slack + Light Documents |
| Head of Finance & Ops | Owns routing rules | All contracts | Threshold approvals, daily digest |, | Light Documents (primary user) |
| Legal |, | Clause deviations, master templates | Clause deviations |, | Slack + Word |
| CFO |, | Above-threshold contracts | High-value, warrants |, | Slack |
| CEO |, | Strategic |, | Most contracts | DocuSign emails |
| Board |, |, | Warrants, equity | Equity docs | Email magic links |

## What is real in the prototype vs stubbed

See README "What works vs what is stubbed" for the comprehensive table. Every stubbed piece is explicitly labeled in the UI with a "Demo:" callout.

## Features the prototype includes but the case study did not require

- **CRM-agnostic source records** with system badges (Salesforce, HubSpot, Attio, Personio, Ashby, Manual entry). Shows pluggable adapter design.
- **Three Light entities** (Denmark, UK, US Delaware) reflecting realistic Series A multi-jurisdiction setup.
- **Conditional template sections** that attach exhibits automatically based on field values.
- **Per-template DocuSign feature config** showing the right combination per document type (QES vs SMS vs witness vs PowerForm).
- **Notification channel design** per approval role (Slack DM for internal, email magic link for external).
- **Salary band lookup** with role-specific min/max ranges, editable in production by Head of People.
- **State machine** with explicit valid transitions and immutable updates.
- **Reset demo** button that clears localStorage and re-seeds, so the prototype is safe to poke at.
