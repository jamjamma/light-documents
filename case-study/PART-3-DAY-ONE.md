# Case Study, Part 3: Day One Mindset

The 1-1 with Martina is the deliverable. The week before it is for arriving with one position worth her time, and for collecting enough context not to ask her things I could have found out on my own.

I would organise the week around two questions:

1. What is the company actually like from the inside?
2. What handoffs is this role going to live on?

Everything below maps to one of those.

---

## What I would read

Three lenses on the same company, read in parallel and weighted by what I find. The analytical value sits in the gaps between them, not in any single lens.

### Lens 1. What is actually happening on the ground

Read this first. Highest signal, fastest decay.

| Source | What I am looking for |
|---|---|
| Internal team comms, last 30 days (Slack, Linear, or wherever the team coordinates day to day) | Customer feedback, deployment friction, wins, losses, deal-desk exceptions |
| 2 to 3 recorded customer calls if Gong or Fireflies is in use | One new-logo kickoff, one mid-deployment, one expansion. 1.5x speed. |
| Support tickets and escalations from the last quarter | The same issue surfacing more than once |
| The real customer roster | ARR, segment, geography, go-live date. Not the website logos. Where heavy ACVs sit. Where churn or expansion has happened. |

### Lens 2. What leadership says should be happening

Useful after Lens 1, because then the delta between stated and lived becomes visible.

| Source | What I am looking for |
|---|---|
| Strategy docs, OKRs, current-quarter priorities (in whatever workspace the company uses for written planning) | What leadership says the company is doing. Half-written and "v1" docs often tell you more than the polished ones. |
| Recent all-hands recordings and internal video updates | Where the CEO directs attention is the de facto priority list. |
| Pricing, packaging, and discount-approval policy (if one is written down) | Where the commercial model meets reality. |
| Martina's last team update or all-hands segment | So I am not asking her to repeat what she has already said publicly. |
| My own job description, re-read | What does the role actually mean given what the company is trying to do. |

### Lens 3. How the outside sees Light

Lowest cost to consume, useful in parallel.

| Source | What I am looking for |
|---|---|
| Publicly available investor framing (Balderton's piece; Atomico's blog where published) | Investor logic is closer to ground truth than founder narrative. |
| Jonathan's public talks and recent press (Slush, TechCrunch coverage, podcasts) | The through-line: Pleo → Juni → Light. The NetSuite frustration is documented down to page-load speed. |
| NetSuite vs. AI-native ERP coverage (Rillet, Campfire teardowns) | How Light is framed inside the wave. |
| Adjacent battles Light is not fighting yet (Pennylane in France; Brex / Ramp at the spend layer) | What Light might inherit at the next stage. |
| Practitioner threads on NetSuite-to-AI-native migrations (Reddit `r/Accounting`, LinkedIn FinOps) | Where the real customer friction lives. |

### Read for the gaps, not the headlines

The job is in the gaps between lenses.

| Pattern | What it tells me |
|---|---|
| Leadership talks about cost-to-deploy in all-hands, but the deployment team channel has nothing on it | Gap between stated and lived priority |
| Investors frame multi-entity as the wedge, but the team is not shipping toward it | Gap between thesis and execution |
| The CEO calls out one customer publicly, the support thread tells a different story | Gap between narrative and reality |

Triangulating across the three lenses is closer to the real work than reading any one of them well.

---

## Who I would talk to

Martina is the destination. Everyone else is mapped to a specific handoff. Handoffs are where this role's leverage lives.

### Five 1-1s

| Person | Handoff they sit on | What I want from them |
|---|---|---|
| Whoever else is on F&O (or Martina's closest cross-functional ally if it is still her and me) | The internal F&O cadence | The real month-end timeline. What is automated, what is not. Where she runs hot. What has been tried and parked. |
| Deployment or CS lead | Closed-won → live customer (where the case study problem bites) | What breaks during onboarding, week by week. Where their hours go that they wish did not. |
| One AE or commercial lead | Customer ask → contract / billing reality | What customers raise late that we cannot answer cleanly. Where deal terms do not carry through to ops. |
| One engineer on the ledger or workflow team | Product capability → ops automation | What "AI-native" means in the codebase vs the marketing. What is automatable today without shipping new code. |
| Legal or compliance (in-house or fractional) | Commercial intent → legally binding artefact (the case study itself) | The issuance process from their seat, before I form a view. |

### Three meetings to sit in on, silently

| Meeting | What I learn |
|---|---|
| Weekly deployment standup | What is actually slow this week, in the team's own words |
| One customer kickoff or QBR | How customers describe what they bought, and what they expect from us next |
| The next month-end close | The shape of the operating cadence Martina actually runs |

### Who I would not ask for time

**Jonathan.** He is running a 30x-growth company through a US expansion. A week-one junior asking for 30 minutes is the tax a fast-moving CEO should not pay. I would absorb his thinking from all-hands, internal video, and press. If he wants the 30 minutes later, that is a different conversation.

### Ground rules

| Rule | Why |
|---|---|
| 30-minute time-box per chat | Respects their week and forces me to come prepared |
| One-paragraph note after each | Forces synthesis the same day, while the conversation is still warm |
| Follow patterns that show up by Wednesday | If three people independently name the same friction, that is the signal. If not, I keep questions tight rather than chase ambiguity. |

---

## The one thing I would come with a point of view on

I will not pretend to know what Light's biggest F&O problem is after one week. That would be confident-sounding nonsense, and any operator who has actually run a team will spot it instantly.

What I can bring is a method, not a conclusion. Three commitments, ordered from analytical bias to strategic framing to posture.

### 1. Find the handoffs, not the loudest pain

In fast-growing companies, operational friction lives at handoffs more than inside any single team.

- Sales → legal.
- Legal → finance.
- Finance → customer success.
- Hire → people ops.
- Compliance → audit evidence.

The case study's contract problem is itself a handoff problem dressed as a document problem. Editing the Word file is annoying. The real cost is what does not carry through to billing, onboarding, renewal, and audit, because signing does not capture structured data.

My bias is to find the handoffs where manual work today will quietly break at next quarter's volume, and fix one cleanly, rather than chase whichever process is loudest in the standup this week.

### 2. The internal practice is product research

Light sells an AI-native finance platform to companies still running on spreadsheets, DocuSign, and Word templates. The case study is a Light example of that pattern.

That is not a contradiction. Every Series A startup runs internally on duct tape. But it is the most legitimate place for an F&O hire to start, because every internal workflow I help clean up is also a candidate spec for what Light could one day sell.

- Linear runs on Linear.
- Lovable, a Light customer, runs on Lovable.

F&O at Light has an unusual property: the internal work is also product research.

### 3. Earn the right to bigger opinions later

I would rather come to Martina at the end of the quarter with one clean diagnosis of one workflow than five half-formed takes at the end of week one. The failure mode I want to avoid is being the new hire who has opinions before they have data.

### What I would actually want from the 1-1

For Martina to tell me where this is wrong.

- Maybe internal-process work is not the right starting point for this role, and the bigger lever is GTM ops or commercial deal-desk.
- Maybe the contract workflow is already in flight and I should leave it alone.

Either of those is more useful than me being right.

That is what I would walk into the 1-1 with.

Jeewoo
