# Features

This doc walks through every feature: what it is, why it exists, how it works, and what is real vs stubbed.

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

**What was manually edited today:** 15-20 fields per contract. Counterparty, value, payment terms, liability cap, indemnity, governing law, term, auto-renew, DPA flag, signer name + title + email.

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
- Service Level Exhibit (Exhibit A) — always
- Data Processing Agreement (Exhibit B) — when DPA required
- eIDAS QES identity verification — when ARR ≥ €100k and EU governing law

**DocuSign features used:** AutoPlace (8 anchor tags), sequential signing (counterparty first), 30-day expiry, day-3-7-14 reminders, Identify QES for high-value EU contracts.

### Employment Contract (Denmark)

**What was manually edited today:** the worst offender. ~20+ fields per offer.

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
- Commission Plan Exhibit — when role matches /sales|account|revenue/
- IP Assignment Addendum — when role matches /engineer|product|design|research/
- Equity Grant Addendum — when equityBps > 0
- Non-compete Addendum — when role matches /vp|director|head of|chief/

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
- Board Resolution (Exhibit A) — always
- Latest 409A Valuation (Exhibit B) — always
- Acceleration Addendum — when applicable

**DocuSign features used:** AutoPlace (8 anchor tags including witness), sequential signing, **eIDAS QES required**, **witness signer as third recipient**, 30-day expiry, day-7-14 reminders.

### Vendor Agreement

**What was manually edited today:** vendor name + signer, services description, monthly fee, term, payment terms, data processing flag, indemnity, termination terms.

**Volume:** ~5-15 / month.

**How our system eliminates it:**

| Variable | Source |
|---|---|
| Vendor name, signer | Light ledger vendor record (renewal) OR Manual entry (new) |
| Services description | Copied from previous contract on renewal |
| Monthly fee | Renewal: from prior contract. New: typed. |
| Term, auto-renew, payment | Defaults from Light's master (12 mo, on, Net 30) |
| Data processing flag | Asked explicitly; triggers DPA + SOC2 exhibits when on |

**Conditional sections attached automatically:**
- DPA Exhibit — when data processing flag is on
- SOC2 Addendum — when data processing flag is on

**DocuSign features used:** AutoPlace (6 anchor tags), parallel signing, 21-day expiry, day-3-7-14 reminders.

## How the manual DocuSign field placement friction is killed

For every document type, the same mechanism:

1. **Counsel embeds anchor tags ONCE in the master template** as white-on-white text (invisible to signer). Each template defines its own anchor convention (see Templates page in app for the full list per template).
2. **At send time, our system calls DocuSign with `anchorString` tabs** that match each anchor tag.
3. **DocuSign scans the doc, finds the anchors, places the fields automatically.** Zero manual dragging.
4. **Anchors move with text reflow.** Unlike absolute (x,y) positioning, anchors are immune to layout changes.

## Cross-functional surface

| Persona | Triggers | Reviews | Approves | Signs | Where they work |
|---|---|---|---|---|---|
| AE / Sales rep | Generate contract from Salesforce / HubSpot | own drafts | — | — | Salesforce + Slack |
| Recruiter | Generate offer from Personio / Ashby | own drafts | — | — | ATS + Slack |
| Head of People | — | All employment | Above-band exceptions | — | Slack + Light Documents |
| Head of Finance & Ops | Owns routing rules | All contracts | Threshold approvals, daily digest | — | Light Documents (primary user) |
| Legal | — | Clause deviations, master templates | Clause deviations | — | Slack + Word |
| CFO | — | Above-threshold contracts | High-value, warrants | — | Slack |
| CEO | — | Strategic | — | Most contracts | DocuSign emails |
| Board | — | — | Warrants, equity | Equity docs | Email magic links |

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
