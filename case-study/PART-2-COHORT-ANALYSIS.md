# Light Documents Case Study — Part 2

## SaaS Cohort Analysis

---

## Question 1. Calculate NRR for each cohort with 12 months of data. What is the blended NRR?

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

**Interpretation.** The mature base expands every $1.00 of starting MRR into approximately $1.28 over twelve months. Strong on a small sample of two cohorts.

---

## Question 2. Diagnose the retention pattern. What could explain it? What would you investigate?

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

### Step 5: Hypothesis

The data shows two expansion phases that behave very differently. Reading them together is what the headline NRR misses.

**Phase 1: Mid-cycle expansion (M3 to M6) is collapsing.**

| Cohort | M3 | M6 | M3 → M6 expansion |
|--------|----|----|-------------------|
| Q1 2024 | 105.5% | 114.5% | +9.0pp |
| Q2 2024 | 104.5% | 113.4% | +8.9pp |
| Q3 2024 | 102.6% | 109.0% | +6.4pp |
| Q4 2024 | 103.3% | 105.4% | +2.1pp |

Across four cohorts, expansion in this window has fallen from ~9 points to ~2 points. M3 itself is stable, so customers are landing and onboarding similarly. The deterioration is in the expansion phase, not the activation phase.

**Phase 2: A late-cycle expansion event around the annual renewal.**

Q1 2024 is flat from M9 (123.6%) to M12 (123.6%) and then jumps to 147.3% by M18, a +23.7pp move. That shape is not smooth organic growth. It looks like a renewal-cycle event: customers re-contracting with bigger commitments, multi-year upgrades, or seat true-ups timed to the anniversary.

**Reading the two phases together.**
- Mid-cycle expansion is genuinely deteriorating.
- Late-cycle expansion may be the more important value driver, and we have visibility into it for only one cohort.
- Some of the apparent cohort decay is real (mid-cycle expansion is collapsing) and some is structural (newer cohorts have not yet reached their renewal moment).
- The headline 127.9% blended NRR at M12 understates lifetime value if the renewal-cycle event repeats. It overstates current health if mid-cycle expansion keeps deteriorating.

**Leading view.** The expansion engine has bifurcated. Something about the way the company drove mid-cycle expansion has stopped working as cohort size doubled, while the renewal-cycle event appears to be intact for the one cohort we can observe. The mechanism behind the mid-cycle drop is not visible in this data: it could be customer success coverage failing to scale, a change in product packaging that left less room for early upsell, weaker activation that pushes customers below the upsell threshold, or a deliberate sales decision to consolidate expansion at renewal. The data tells us the symptom is real and concentrated; it does not tell us the cause.

**One alternative to rule out first.** If earlier cohorts signed contracts with stronger ramp or renewal terms than newer cohorts, part of both the mid-cycle expansion and the Q1 2024 M18 jump is a contract-design artifact rather than a behavioural change. Worth testing first because it is cheap to verify and would rebase the diagnosis.

**Commercial implication.** If mid-cycle expansion is genuinely broken, the fix is operational and high-leverage but cannot be specified without knowing the mechanism. If the renewal-cycle event holds for newer cohorts, long-term cohort economics are stronger than the M6 trend implies and the ARR opportunity is concentrated at renewal moments. The risk is that management, anchored to M6 retention, either underinvests in renewal motion (because M12 looks weaker than it is) or invests in M3 to M6 fixes without first identifying what actually broke.

**Validation priority.** Pull contract structure for Q1 and Q2 2024 to test the ramp-artifact view. Then decompose mid-cycle expansion into seat adds, module attach, usage growth, and CS-driven upsell to identify which mechanism has weakened. Track Q2 2024 through M18 closely: it is the next cohort to cross the renewal threshold and will tell us whether the late-cycle event repeats.

---

## Question 3. If M6 retention improved by 10 percentage points across all future cohorts, what does that do to ARR at month 18?

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

### Recommended answer

Under Scope A, a 10 percentage point M6 retention improvement adds **$268k to $344k of incremental M18 ARR**, depending on whether the uplift simply persists or compounds with later expansion. Under Scope B, the range scales to **$552k to $710k**. The trajectory case should be read as an upper bound because the Q1 2024 M6 to M18 ratio is inflated by what looks like a renewal-cycle expansion event we have not yet seen repeat.

---

## Executive Summary

- **Headline.** Mature cohorts show 127.9% blended 12-month NRR. Strong land-and-expand profile on a small sample.
- **The real story is two expansion phases behaving differently.** Mid-cycle expansion (M3 to M6) has collapsed from +9pp to +2pp across four cohorts. Late-cycle expansion looks renewal-driven: Q1 2024 is flat from M9 to M12 then jumps to 147.3% at M18.
- **Implication.** Some of the apparent cohort decay is a real expansion-engine problem; some is simply that newer cohorts have not yet reached their renewal moment. The headline retention curve obscures both.
- **Caveat.** Net retention above 100% does not prove the base is healthy. Logo retention, churn, GRR, and contract structure are not visible in this dataset.
- **Working hypothesis.** Mid-cycle expansion has broken at scale, mechanism unknown. Renewal-cycle expansion may still be intact but is observed in only one cohort.
- **Modelled upside.** A 10 percentage point M6 improvement on the two pre-M6 cohorts adds $268k to $344k of M18 ARR; broader sensitivity (all pre-M18 cohorts) is $552k to $710k. Trajectory case should be read as an upper bound given the renewal-event distortion in Q1 2024.
- **Next steps.** Pull contract structure for Q1 and Q2 2024 to test the ramp-artifact view. Track Q2 2024 through M18 to see whether the renewal-cycle expansion repeats.
