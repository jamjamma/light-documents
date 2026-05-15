# Cross-functional design

How Light Documents lives in the real organisation: who uses what, how handoffs flow, what gets notified where.

## Integration architecture

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Salesforce / │  │ Personio /   │  │ Google Drive │  │ Light Ledger │
│ HubSpot /    │  │ Ashby /      │  │ (master      │  │ (MRR, HC,    │
│ Attio (deals)│  │ Workday (HR) │  │  templates)  │  │  cap table)  │
└───────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
        │  read           │  read          │  read+write    │  read+write
        └─────────────────┼────────────────┼────────────────┘
                          ▼                ▼
                  ┌───────────────────────────────┐
                  │   LIGHT DOCUMENTS             │
                  │   workflow + state machine    │
                  └───────┬───────────┬──────┬────┘
                          │           │      │
                          ▼           ▼      ▼
                    ┌─────────┐ ┌─────────┐ ┌────────┐
                    │  Slack  │ │DocuSign │ │ Email  │
                    │ DM +    │ │envelope │ │ magic  │
                    │ channel │ │ create  │ │ links  │
                    └─────────┘ └─────────┘ └────────┘
                          │           │         │
                          ▼           ▼         ▼
                    Internal       Counter-   Board /
                    approvers      party      external
                                              counsel
```

## Who is involved and what they do

| Persona | Triggers | Reviews | Approves | Signs | Lives in |
|---|---|---|---|---|---|
| AE / Sales rep | Generate contract from Salesforce / HubSpot deal | own drafts |, |, | Salesforce + Slack |
| Sales Ops / RevOps |, | sales contracts pre-send | discount approvals if delegated |, | Salesforce + Light |
| Recruiter | Generate offer from Personio / Ashby | own drafts |, |, | ATS + Slack |
| Hiring manager |, | Offer details |, |, | Slack |
| Head of People |, | All employment contracts | Above-band salary approvals |, | Slack + Light Documents |
| Head of Finance & Ops (the case study role) | Owns routing rules + thresholds | All contracts | Threshold approvals, daily digest reviewer |, | Light Documents (primary user) |
| Finance / accounting |, | Reads signed contracts for revrec |, |, | Light ledger |
| In-house counsel / Legal |, | Clause deviations, master templates | Clause deviations |, | Slack + Light + Word |
| Outside counsel |, | Bespoke (warrants, M&A) |, |, | Email + Word |
| CFO |, | Above-threshold contracts | High-value deals, warrants, vendor |, | Slack |
| CEO |, |, | Strategic deals | Most contracts on Light side | DocuSign emails |
| Board |, |, | Warrants, equity grants | Equity docs | Email magic links |
| Counterparty |, | Final document via DocuSign |, | their own signature | DocuSign emails |

## End-to-end walkthrough with names: Acme MSA

1. **Tom (AE)** moves Salesforce Opp 00821 to Closed Won at €60k ARR.
2. **Light Documents** detects the stage change via Salesforce webhook. Posts a Slack DM to Tom: "Acme is closed-won. Ready to send the MSA? [Generate contract →]"
3. Tom clicks. Lands on the New Contract page with template MSA and source = Acme deal pre-selected. Form prefilled.
4. Tom changes the counterparty signer (Acme's CFO Maria, not the day-to-day contact). Clicks Run checks.
5. All clauses standard. Routing engine returns: Head of Finance auto-approve (ARR < €100k, all clauses standard).
6. **Martina (Head of Finance & Ops)** gets a Slack DM: "Acme MSA €60k auto-approved by your standing rule. [View] [Override before send]."
7. Tom clicks Send via DocuSign. Light Documents:
   - Generates the doc from MSA v4.2 + Acme variables.
   - Creates a DocuSign envelope via API.
   - Sets recipients: Maria (Acme), Jonathan (Light CEO).
   - Anchor tags place all signature fields automatically.
   - Posts to #sales-wins: "Tom sent Acme MSA, €60k ARR, awaiting Maria signature."
8. Maria signs via DocuSign email. Jonathan signs.
9. **DocuSign webhook** fires to Light Documents.
10. Light Documents:
    - Stores the signed PDF in Drive at `Contracts/Customers/Acme/2026-05-Acme-MSA-signed.pdf`.
    - Writes to the Light ledger: +€5k MRR, +€60k ARR, contract start 2026-06-01, renewal date 2027-04-15, linked to Salesforce Opp 00821.
    - Updates Salesforce: Opp 00821 → "Contract Signed", contract URL field populated.
    - Creates a calendar alert for the renewal in Jonathan's and Tom's calendars.
11. Slack notifications:
    - Tom (DM): "Acme MSA signed. €5k MRR booked. Salesforce updated. Renewal alert set."
    - Martina (DM): "Acme MSA signed and filed. Ledger entry #4421 created."
    - #sales-wins channel: "€60k Acme MSA closed by Tom."
12. **Sara (RevOps)** sees the MRR in Light's standard dashboard automatically. No re-keying.

Twelve steps. Zero manual handoffs after step 4.

## Notification design

Three surfaces, used for different audiences.

| Surface | Audience | Examples |
|---|---|---|
| **Slack DM** | Specific person who must act | "Approve this offer letter", "Your contract was rejected", "You have 3 contracts blocked" |
| **Slack channel** | Team for awareness | #sales-wins (deal closed), #people-ops (hire signed), #exec-updates (warrant granted), #legal-queue (clause flagged) |
| **Email magic link** | External or non-Slack users | Board chair (warrants), outside counsel, sometimes contractors |

## RBAC matrix (production)

| Role | See | Edit drafts | Edit templates | Edit routing rules | Approve | Override approvals |
|---|---|---|---|---|---|---|
| AE | own deals | own |, |, |, |, |
| Sales Ops | all sales |, | sales templates |, | discounts if delegated |, |
| Recruiter | own roles | own |, |, |, |, |
| Head of People | all employment |, | employment templates | salary bands | above-band exceptions |, |
| Head of Finance & Ops | all |, |, | all routing rules | threshold approvals | yes |
| Legal | all |, | master templates + clause rules | clause-related | clause deviations |, |
| CFO | all |, |, | financial thresholds | high-value, warrants | yes |
| CEO | all |, |, |, | strategic + signs | yes |
| Board | warrants + equity only |, |, |, | equity approvals |, |
| External counterparty | only what they're signing |, |, |, |, |, |

The Head of Finance & Ops role (the case study role) is the operating owner. Owns the rules engine. Sees everything. Can override anything.

## Failure modes the design handles

| Failure mode | How we handle it |
|---|---|
| Approver on PTO | Each role has a configurable delegate. Slack DM routes to delegate when out-of-office detected (Google Calendar integration). |
| Counterparty redlines a clause | Two paths: (a) accept their version, re-runs clause check, re-routes for approval; (b) counter-propose, opens Word-side negotiation lane with track changes. |
| AE leaves Light | Contracts owned by ex-employees auto-reassign to their manager. Surfaces on dashboard as "Orphaned". |
| Template updated mid-flow | Contract version is pinned at create time. Banner: "Master template updated to v4.3. Restart with new version? [Yes] [Keep v4.2]". |
| DocuSign envelope expires | Auto-reminder day 3 and day 7. Auto-close and re-route to AE at day 14. |
| Board approval delay on warrants | State sits indefinitely. Daily digest surfaces after 14 days as "long pending." |
| Counterparty wants to use their template | Mark as bespoke, route to Legal, switch to manual lane but still track in dashboard. |
| Source system goes offline | Sync paused, cached records still pickable, banner warns "Salesforce sync paused since 14:32. Records may be stale." |

## Integration priority order (Phase 2)

This is what gets built after the MVP wraps DocuSign, in order of ROI:

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
