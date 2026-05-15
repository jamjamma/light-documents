# Light Documents Case Study, Part 2

## SaaS Cohort Analysis

---

## Question 1. Calculate NRR for each cohort with 12 months of data. What is the blended NRR?

> **Answer.** Blended 12-month NRR is **127.9%** (revenue-weighted across Q1 + Q2 2024).
> Q1 2024 = 123.6%. Q2 2024 = 131.3%. Two-cohort sample, so directional rather than load-bearing.

**Definition**
- `NRR = Period MRR / Starting MRR`, holding the cohort fixed and excluding new logos. Captures expansion, contraction, and churn.

**Cohorts with 12 months of data**

| Cohort | M0 MRR | M12 MRR | 12M NRR |
|--------|--------|---------|---------|
| Q1 2024 | $55k | $68k | **123.6%** |
| Q2 2024 | $67k | $88k | **131.3%** |

**Blended 12-month NRR (revenue-weighted)**

`($68k + $88k) / ($55k + $67k) = $156k / $122k = 127.9%`

Revenue-weighted blending is used so larger cohorts carry proportionally more weight than a simple average would allow.

**Interpretation.** The two mature cohorts expand every $1.00 of starting MRR into approximately $1.28 over twelve months. Two-cohort sample, so treat the headline as directional rather than load-bearing.

---

## Question 2. Diagnose the retention pattern. What could explain it? What would you investigate?

> **Answer.** The headline NRR averages two diverging expansion phases:
>
> - **Mid-cycle (M3 → M6) is breaking.** Expansion in this window fell from +9pp to +2pp across four cohorts.
> - **The renewal moment looks intact.** Q1 2024 jumped from 123.6% at M12 to 147.3% at M18. One data point with a clean shape.
>
> The symptom is concrete. The cause is not visible in this data. **First check: pull contract structure for Q1 and Q2 2024** — cheap to verify, would rebase everything else.

### Step 1: Retention triangle

| Cohort | M3 | M6 | M9 | M12 | M18 |
|--------|------|------|------|------|------|
| Q1 2024 | 105.5% | 114.5% | 123.6% | 123.6% | 147.3% |
| Q2 2024 | 104.5% | 113.4% | 120.9% | 131.3% | |
| Q3 2024 | 102.6% | 109.0% | 114.1% | | |
| Q4 2024 | 103.3% | 105.4% | | | |
| Q1 2025 | 103.8% | | | | |

### Step 2: Customer count at landing

| Cohort | Customers | M0 MRR | M0 MRR per customer |
|--------|-----------|--------|---------------------|
| Q1 2024 | 15 | $55k | $3.67k |
| Q2 2024 | 18 | $67k | $3.72k |
| Q3 2024 | 21 | $78k | $3.71k |
| Q4 2024 | 25 | $92k | $3.68k |
| Q1 2025 | 28 | $105k | $3.75k |
| Q2 2025 | 32 | $118k | $3.69k |

- Customer count up 113% across six quarters. Acquisition is scaling fast.
- Starting MRR per customer is consistent at ~$3.7k. Initial deal size at landing is stable. Not equivalent to flat ACV without contract structure data.

### Step 3: The three signals that matter

**Signal 1: Cohort decay across cohorts**
- Each successive cohort retains less well at every comparable age.
- M6: 114.5% → 113.4% → 109.0% → 105.4%.
- M9: 123.6% → 120.9% → 114.1%.
- Directional, consistent, and not a single-cohort anomaly.

**Signal 2: Growth is volume-led, not value-led**
- Customer count is scaling fast; starting MRR per customer is flat.
- The company is winning more deals of similar size, not larger or higher-value deals.
- Cohort decay is therefore not explained by smaller landing deals.

**Signal 3: Net retention above 100% does not prove the base is healthy**
- Only net cohort MRR movement is visible.
- Logo retention, churn, GRR, and expansion vs contraction split are not.
- A few large expanding accounts could be masking churn elsewhere.

### Step 4: Data gaps

Conclusions are bounded by what is missing:
- Customer count at M3 to M18 (yields logo retention and churn rate).
- NRR decomposition into GRR, expansion, contraction, churn.
- Contract structure: length, ramp terms, multi-year vs annual.
- Segment cuts by sales channel, customer size, geography, industry.

### Step 5: Two expansion phases, behaving differently

The headline NRR averages over two phases that are diverging. Reading them separately is what the headline misses.

**Phase 1: Mid-cycle expansion (M3 → M6) is collapsing.**

| Cohort | M3 | M6 | M3 → M6 |
|--------|----|----|---------|
| Q1 2024 | 105.5% | 114.5% | +9.0pp |
| Q2 2024 | 104.5% | 113.4% | +8.9pp |
| Q3 2024 | 102.6% | 109.0% | +6.4pp |
| Q4 2024 | 103.3% | 105.4% | +2.1pp |

Expansion in this window has fallen from ~9pp to ~2pp across four cohorts. M3 itself is stable, so activation is similar. The deterioration is in the expansion phase.

**Phase 2: A late-cycle expansion event around the annual renewal.**

Q1 2024 is flat M9 → M12 (123.6% → 123.6%) then jumps to 147.3% by M18 (+23.7pp). The shape is not smooth organic growth. It looks like customers re-contracting with bigger commitments, multi-year upgrades, or seat true-ups at the anniversary.

### Step 6: Hypothesis

Two things are happening at once.

1. **Mid-cycle expansion is breaking.** As cohort sizes doubled, the M3 → M6 upsell motion stopped scaling. Real, not a measurement artifact.
2. **The renewal moment looks intact.** Q1 2024 re-contracted hard at M18 (+23.7pp). One data point, but a clean shape.

The headline 127.9% NRR averages both and hides both. The symptom is concrete; the cause is not visible in this data.

| | Reading |
|---|---|
| Mid-cycle (M3 → M6) | Deteriorating across four cohorts. |
| Late-cycle (M9 → M18) | Renewal-driven, observed in only one cohort. |
| Headline 127.9% | Overstates current health, understates lifetime value. |

### Step 7: Candidate causes for the mid-cycle drop

Two hypotheses worth ruling in or out, in order of how I would test each:

- **CS coverage failing to scale.** Cohort sizes doubled. CS team may not have. Easy to test: CS headcount vs active accounts over time.
- **Weaker activation.** Customers landing below the usage threshold where mid-cycle upsell makes sense. Test against activation cohort metrics.

### Step 8: What to verify first

| Order | Check | Why first |
|---|---|---|
| 1 | Pull contract structure for Q1 and Q2 2024 | If early cohorts had stronger ramp or renewal terms, part of both the mid-cycle expansion and the Q1 2024 M18 jump is a contract-design artifact, not a behaviour change. Cheap to verify, would rebase everything else. |
| 2 | Decompose mid-cycle expansion (seat adds, module attach, usage growth, CS-led upsell) | Names which mechanism weakened. |
| 3 | Track Q2 2024 through M18 | Next cohort to cross the renewal threshold. Tells us whether the late-cycle event repeats. |

---

## Question 3. If M6 retention improved by 10 percentage points across all future cohorts, what does that do to ARR at month 18?

> **Answer.** A 10pp M6 uplift adds **$268k to $344k of incremental M18 ARR** on the two cohorts not yet at M6 (Q1 + Q2 2025), depending on whether the uplift persists or compounds with later expansion.
>
> Broader sensitivity (all cohorts not yet at M18, Q2 2024 → Q2 2025): **$552k to $710k**.
>
> The upper bound treats Q1 2024's M6 → M18 ratio (1.286x) as the trajectory. That cohort's M18 jump includes what looks like a renewal-cycle upsell, so treat the upper bound as a ceiling, not a base expectation.

### Forecasting is required

- Only Q1 2024 has observed M18 data. All other M18 outcomes must be projected.
- `M18 ARR = M18 MRR × 12`. A higher M6 raises the base flowing through to M18.

### Stated assumptions

**A. Which cohorts count as "future cohorts"?**
- **Scope A: cohorts pre-M6** (Q1 2025, Q2 2025). The two cohorts that have not yet reached the M6 mark. Cleanest reading of "future" and the recommended baseline.
- **Scope B: cohorts pre-M18** (Q2 2024 through Q2 2025). All cohorts whose M18 outcome is still unobserved. Counterfactual reading; treated as sensitivity.

**B. How does the M6 uplift carry through to M18?**
- **Persistence case:** the incremental MRR at M6 carries flat to M18. Conservative.
- **Trajectory case:** the incremental MRR follows Q1 2024's observed M6 to M18 expansion = `147.3% / 114.5% = 1.286x`. Upside.
- Caveat: the trajectory case is anchored to a single cohort whose M18 jump appears to include a renewal-event upsell. Treat it as an upper bound, not a base expectation.

### Math

A 10 percentage point uplift means the retention rate itself rises by 10 points (e.g., 105% to 115%), not that M6 MRR rises by 10% from current level.

`Incremental MRR at M6 = Starting MRR × 10%`

**Scope A: cohorts pre-M6 (Q1 2025 + Q2 2025)**

| Cohort | M0 MRR | +10pp at M6 |
|--------|--------|-------------|
| Q1 2025 | $105k | $10.5k |
| Q2 2025 | $118k | $11.8k |
| **Total** | **$223k** | **$22.3k MRR** |

- Persistence: `$22.3k × 12 = $268k incremental ARR at M18`
- Trajectory: `$22.3k × 1.286 × 12 = $344k incremental ARR at M18`

**Scope B: cohorts pre-M18 (Q2 2024 through Q2 2025)**

| Cohort | M0 MRR | +10pp at M6 |
|--------|--------|-------------|
| Q2 2024 | $67k | $6.7k |
| Q3 2024 | $78k | $7.8k |
| Q4 2024 | $92k | $9.2k |
| Q1 2025 | $105k | $10.5k |
| Q2 2025 | $118k | $11.8k |
| **Total** | **$460k** | **$46.0k MRR** |

- Persistence: `$46.0k × 12 = $552k incremental ARR at M18`
- Trajectory: `$46.0k × 1.286 × 12 = $710k incremental ARR at M18`
