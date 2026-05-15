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
| Recent all-hands recordings and internal video updates | Where the CEO directs attention is the de facto priority list. |
| Pricing, packaging, and discount-approval policy | Where the commercial model meets reality. |
| Martina's last team update or all-hands segment | So I am not asking her to repeat what she has said publicly. |
| My own job description, re-read | What the role actually means given what the company is trying to do. |

### Lens 3. How the outside sees Light

Lowest cost to consume, useful in parallel.

| Source | What I am looking for |
|---|---|
| Publicly available investor framing (Balderton's piece; Atomico's blog where published) | Investor logic is closer to ground truth than founder narrative. |
| Jonathan's public talks and recent press (Slush, TechCrunch, podcasts) | The through-line: Pleo → Juni → Light. The NetSuite frustration is documented down to page-load speed. |
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

### 2. The internal practice is product research

Light sells AI-native finance to companies still running on spreadsheets, DocuSign, and Word templates. The case study is a Light example of that pattern.

Not a contradiction. Every Series A startup runs internally on duct tape. But it is the most legitimate place for an F&O hire to start — every internal workflow I clean up is a candidate spec for what Light could one day sell.

- Linear runs on Linear.
- Lovable, a Light customer, runs on Lovable.

F&O at Light has an unusual property: the internal work is also product research.

### 3. Earn the right to bigger opinions later

I would rather come to Martina at the end of the quarter with one clean diagnosis of one workflow than five half-formed takes at the end of week one. The failure mode I want to avoid: being the new hire with opinions before data.
