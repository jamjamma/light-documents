# Part 2: SaaS cohort analysis

## The data

| Cohort | Customers | M0 | M3 | M6 | M9 | M12 | M18 |
|---|---|---|---|---|---|---|---|
| Q1 2024 | 15 | $55k | $58k | $63k | $68k | $68k | $81k |
| Q2 2024 | 18 | $67k | $70k | $76k | $81k | $88k | — |
| Q3 2024 | 21 | $78k | $80k | $85k | $89k | — | — |
| Q4 2024 | 25 | $92k | $95k | $97k | — | — | — |
| Q1 2025 | 28 | $105k | $109k | — | — | — | — |
| Q2 2025 | 32 | $118k | — | — | — | — | — |

## Q1. NRR per cohort with 12 months of data, and blended

Only Q1 2024 and Q2 2024 have full 12-month data.

**NRR (Net Revenue Retention) = M12 MRR / M0 MRR**

| Cohort | M0 MRR | M12 MRR | 12-month NRR |
|---|---|---|---|
| Q1 2024 | $55k | $68k | **123.6%** |
| Q2 2024 | $67k | $88k | **131.3%** |

**Blended 12-month NRR** (weighted by initial MRR):

```
Blended NRR = sum(M12 MRR) / sum(M0 MRR)
            = ($68k + $88k) / ($55k + $67k)
            = $156k / $122k
            = 127.9%
```

127.9% NRR is excellent. For context: world-class SaaS sits at 120%+, top-quartile at 110%+, median around 100%. This company is expansion-led, not retention-led.

## Q2. Diagnose the retention pattern. What could explain it? What would you investigate?

### The pattern at face value

Strong expansion across the board, but with two concerning sub-patterns visible underneath the headline number.

**Sub-pattern 1: M6/M0 expansion is decelerating cohort over cohort.**

| Cohort | M6 / M0 |
|---|---|
| Q1 2024 | 114.5% |
| Q2 2024 | 113.4% |
| Q3 2024 | 109.0% |
| Q4 2024 | 105.4% |
| Q1 2025 | (TBD) |

Each newer cohort expands less in its first 6 months than the cohort before it. If this continues, by Q1 2025 the cohort might land at ~103% at M6.

**Sub-pattern 2: Q1 2024 M9 → M12 plateau, then big jump M12 → M18.**

M9 = $68k, M12 = $68k (zero expansion), then M18 = $81k (+19% in 6 months). This shape is characteristic of **annual contract renewals with upsells**: the cohort signed annual deals at M0, hit no expansion during the term, then renewed with seat additions / tier upgrades at month 12-13. The M18 jump is the renewal motion.

### What could explain it

Hypotheses, ranked by likelihood:

1. **Land-and-expand motion working.** Customers are buying small, then expanding via seats / tier upgrades / add-ons. This is healthy when it's seat growth driven by product stickiness.
2. **Annual contract renewal cycle dominates.** Most expansion happens at renewal, not mid-term. Consistent with the M9→M12 flat-then-M18-jump pattern in Q1 2024.
3. **Newer cohorts have larger initial deals but less expansion runway.** M0 grew from $55k (Q1 2024) to $118k (Q2 2025), a 2.1x increase in average initial deal size. Larger initial deals often mean less headroom for expansion (already starting near plan capacity). This explains the declining M6/M0 ratio.
4. **Price hikes on the rate card.** Newer cohorts may be hitting a higher price book, inflating M0 and compressing apparent M6/M0 retention.
5. **Logo churn hidden by expansion.** This is the dangerous one. If 2 of 15 customers churned in Q1 2024 cohort but the remaining 13 expanded enough to push the total to $81k at M18, the headline NRR looks fantastic while gross retention is mediocre. Cannot rule out from this data alone.
6. **Market shift.** Q3-Q4 2024 cohorts saw less expansion, possibly because of macro headwinds at that period or a change in customer ICP.

### What I would investigate

In priority order, ten things I would dig into before drawing conclusions:

| # | Investigation | Why it matters |
|---|---|---|
| 1 | **GRR (Gross Retention Rate) separate from NRR.** GRR = retained MRR / starting MRR, excluding expansion. | If GRR is, say, 80% while NRR is 128%, expansion is masking 20% churn. Different story. |
| 2 | **Logo retention.** % of customers from M0 still active at each month. | Tells me if expansion is from a shrinking customer base. Concentration risk. |
| 3 | **Expansion source breakdown.** Seats vs tier upgrades vs price increases vs cross-sell. | Each implies a different durability and product-fit story. |
| 4 | **Top 5 expanders per cohort.** Who is driving most of the expansion? | Concentration risk. If 80% of expansion is from 2 customers, NRR is fragile. |
| 5 | **Q3 2024 M6 → M9 deceleration.** $85k → $89k = +4.7% in 3 months, slower than peer cohorts. | What changed for this cohort? Industry mix? Sales motion? |
| 6 | **Q4 2024 M3 → M6 anemia.** $95k → $97k = +2.1%. | Early warning of slowing motion, or normal small-cohort variance? |
| 7 | **Cohort customer count over time.** Did all 15 of Q1 2024 stay? | If 2 churned, the remaining 13 must have expanded by 41.4% to hit $81k — concentration concern. |
| 8 | **Contraction events.** Even within an "expanding" cohort, did some customers downgrade? | Contraction is the canary in the coal mine. |
| 9 | **Renewal terms.** Are these multi-year or annual? What discounts on renewal? | Heavy renewal discounts inflate NRR but compress LTV. |
| 10 | **ICP drift.** Are newer cohorts in different segments (enterprise vs SMB)? Different motion drives different expansion patterns. |

### What I would say to the board

> Headline NRR of 128% is genuinely excellent. But three things bother me. First, M6 expansion is declining cohort over cohort. Second, the Q1 2024 cohort's flat M9-M12 then big M18 jump tells me most expansion is happening at the annual renewal moment, not continuously. Third, we have not separated gross retention from net, so I do not yet know how much logo churn is being masked by expansion. Before I extrapolate this NRR into the model, I want to see GRR by cohort, logo retention curves, and a breakdown of where the expansion dollars are actually coming from. If the answer is "seats are growing because customers love us," we are in great shape. If the answer is "two whales are dragging the average up," we have concentration risk to address.

## Q3. If M6 retention improved by 10 percentage points across all future cohorts, what does that do to ARR at month 18?

### Stated assumptions

1. **"M6 retention" = M6 MRR / M0 MRR ratio.** A +10pp improvement means this ratio goes up by 10 absolute points (e.g., 109% → 119%).
2. **"All future cohorts" = cohorts that have not yet hit M6.** As of the snapshot, that is Q1 2025 (currently at M3) and Q2 2025 (currently at M0). Cohorts that already have M6 in the data (Q1-Q4 2024) are locked.
3. **M6 → M18 progression assumed at 1.286x** based on the one fully-observed cohort (Q1 2024: $63k at M6, $81k at M18 = 1.286x). This is the best estimate available but it is fragile because n=1.
4. **Without intervention**, baseline M6/M0 for future cohorts follows the declining trend: Q1 2025 estimated at ~103%, Q2 2025 estimated at ~101%.

### The math

For each affected cohort:

```
Baseline M6 MRR        = baseline_M6_ratio × M0
Improved M6 MRR        = (baseline_M6_ratio + 0.10) × M0
                       = baseline M6 + (0.10 × M0)

Baseline M18 MRR       = baseline_M6 × 1.286
Improved M18 MRR       = improved_M6 × 1.286

Lift to M18 MRR        = (0.10 × M0) × 1.286
                       = 0.1286 × M0
```

### Cohort-by-cohort impact

| Cohort | M0 MRR | Lift to M18 MRR | Lift to M18 ARR (× 12) |
|---|---|---|---|
| Q1 2025 | $105k | +$13.5k | **+$162k** |
| Q2 2025 | $118k | +$15.2k | **+$182k** |
| **Total** | | **+$28.7k MRR** | **+$344k ARR** |

### Three scenarios for context

The answer depends heavily on what "future cohorts" includes.

| Scope | M18 ARR lift |
|---|---|
| Only cohorts not yet at M6 (Q1 + Q2 2025) | **+$344k ARR** |
| All cohorts not yet at M18 (Q3 2024 + Q4 2024 + Q1 + Q2 2025) | **+$606k ARR** |
| Forward-looking, assuming 4 future cohorts of similar size (~$120k M0 each) | Roughly **+$170k ARR per cohort × 4 = +$680k ARR per year, compounding** |

### Caveats I would flag

1. **n=1 for M6→M18 multiplier.** Q1 2024 is the only cohort with M18 data. If Q2 2024 lands differently when its M18 arrives, the multiplier shifts.
2. **Linear extrapolation may be too kind.** The deceleration in M6/M0 suggests the company is hitting a plateau. The +10pp improvement might be harder to achieve in Q2 2025 than in Q1 2024.
3. **The cost of the intervention matters.** If improving M6 retention by 10pp requires a CSM dedicated to every customer (variable cost), the net ARR impact is lower. If it's a product investment that scales (fixed cost), the math is much better.
4. **What drives M6 retention.** Onboarding quality, first-value milestone, in-app activation. Find the leading indicator of M6 expansion and instrument it. The retention math follows from operating well, not from setting a target.

### What I would actually recommend

Before chasing the +10pp M6 retention target, prove out **gross retention** first. NRR is the headline but GRR is the foundation. If GRR is solid (95%+) and the only issue is expansion not happening fast enough, the +10pp investment is clearly worth $344k+ ARR. If GRR is weak (sub-90%), the +10pp expansion goal masks the real problem.
