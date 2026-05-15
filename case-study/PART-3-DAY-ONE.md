# Case Study, Part 3: Day One Mindset

The 1-1 with Martina is the deliverable. The week before is for arriving with one position worth her time, and for collecting enough context not to ask her what I could have found out on my own.

I would organise the week around two questions:

1. What is the company actually like from the inside?
2. What handoffs is this role going to live on?

Everything below maps to one of those.

---

## What I would read

Three lenses on the same company, read in parallel.

### Lens 1. What is actually happening on the ground

Read this first. Highest signal, fastest decay.

| Source | What I am looking for |
|---|---|
| Internal team comms, last 30 days | Customer feedback, deployment friction, wins, losses, deal-desk exceptions |
| Support tickets and escalations from the last quarter | The same issue surfacing more than once |
| The real customer roster | ARR, segment, geography, go-live date. Where heavy ACVs sit. Where churn or expansion has happened. |

### Lens 2. What leadership says should be happening

Useful after Lens 1, so the delta between stated and lived becomes visible.

| Source | What I am looking for |
|---|---|
| Strategy docs, OKRs, current-quarter priorities | What leadership says the company is doing. Half-written and "v1" docs often tell you more than the polished ones. |
| Recent all-hands recordings and internal video updates | Where the CEO directs attention tells you what is actually being prioritised, not what the docs say. |
| Pricing, packaging, and discount-approval policy | Where the commercial model meets reality. |
| Martina's last team update or all-hands segment | So I am not asking her to repeat what she has said publicly. |
| My own job description, re-read | What the role actually means given what the company is trying to do. |

### Lens 3. How the outside sees Light

Lowest cost to consume, useful in parallel.

| Source | What I am looking for |
|---|---|
| Publicly available investor framing (Balderton's piece; Atomico's blog where published) | Investor logic is closer to ground truth than founder narrative. |
| NetSuite vs. AI-native ERP coverage (Rillet, Campfire teardowns) | How Light is framed inside the wave. |
| Adjacent battles Light is not fighting yet (Pennylane in France; Brex / Ramp at the spend layer) | What Light might inherit at the next stage. |
| Practitioner threads on NetSuite-to-AI-native migrations (Reddit `r/Accounting`, LinkedIn FinOps) | Where the real customer friction lives. |

---

## Who I would talk to

Martina is the destination. Everyone else is mapped to a specific handoff — that is where this role's leverage lives.

| Person | Handoff they sit on | What I want from them |
|---|---|---|
| Whoever else is on F&O (or Martina's closest cross-functional ally, if it is still her and me) | The internal F&O cadence | The real month-end timeline. What is automated, what is not. Where she runs hot. What has been tried and parked. |
| Deployment or CS lead | Closed-won → live customer (where the case study problem bites) | What breaks during onboarding, week by week. Where their hours go that they wish did not. |
| AE or commercial lead | Customer ask → contract / billing reality | What customers raise late that we cannot answer cleanly. Where deal terms do not carry through to ops. |
| Engineer on the ledger or workflow team | Product capability → ops automation | What "AI-native" means in the codebase vs the marketing. What is automatable today without shipping new code. |
| Legal or compliance (in-house or fractional) | Commercial intent → legally binding artefact (the case study itself) | The issuance process from their seat, before I form a view. |

---

## The point of view I would bring to the 1-1

I will not pretend to know Light's biggest F&O problem after one week. Anyone who has run a team would spot that as nonsense.

What I would bring is how I plan to approach the work:

### 1. Find the handoffs, not the loudest pain

Operational friction in fast-growing companies lives at handoffs, not inside any single team.

- Sales → Legal
- Legal → Finance
- Finance → Customer Success
- Hire → People Ops
- Compliance → Audit evidence

The case study's contract problem is itself a handoff problem dressed as a document problem. Editing Word is annoying. The real cost is what does not carry through to billing, onboarding, renewal, and audit, because signing does not capture structured data.

My bias: find the handoff where manual work today will break at next quarter's volume, and fix one cleanly, rather than chase whichever process is loudest in standup this week.

### 2. Instrument before you fix

A workflow change that saves five hours next month and zero hours every month after is a one-off, not a fix. The trap is improving something nobody can prove improved.

My bias is to put a single number on the workflow before changing it: time spent, exceptions per week, where it stalls. That makes the before / after auditable to Martina and to anyone who follows me.

This is the same logic the build memo applies to the contract workflow. The structured payload is the measurement, not a side effect.

### 3. Take operational load before opinions

For the first 90 days, I would rather absorb operational work than form opinions on strategy. Picking up the end-of-month, end-of-quarter, and end-of-deal cycles keeps Martina's time on the calls only she can make. It also gives me first-hand context for any view I do eventually bring.

None of that work is glamorous. It is the cheapest to take over, the easiest to measure, and the place I am most likely to be useful before I have earned the right to bigger opinions.
