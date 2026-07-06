# BRD — Business Requirements Document

> ⚠️ PROVENANCE: Generated from `docs/idea.md` (status: draft, schema 1.1.0). Grounded only in
> the brief + `docs/evidence-register.md`. No first-party demand or payer commitment exists yet —
> all business claims below are hypotheses to validate after July 2. No facts fabricated.
> Owner of features `F-###` / journeys / business rules: [PRD](./03-prd.md). This doc owns the
> WHY-for-the-business only. Traces to `idea.md` §1, §6, §8, §9.

## Executive summary

SaferRoute is a community-sourced safer-routing guide for women commuting the PUP Sta. Mesa zone.
It structures the route-safety crowdsourcing women already do by hand (group chats, memory) into a
pre-trip "which segments to avoid tonight, and why" check. The business bet is **not** direct
consumer revenue — the woman commuter has weak willingness to pay for information that can't
physically move her (`idea.md` §5). The bet is that a **dense, trusted, hyperlocal safety dataset
built by earning one community's love** becomes the asset institutions will pay for: LGUs with
mandated GAD budgets, transport operators exposed to RA 11313 / LTFRB liability, and grant funders.
Demand is **unvalidated**; the entire business rests on one riskiest assumption (§9) and no payer
has committed.

## Business objectives

| # | Objective | Metric (from `idea.md` §8) | Why it's the business, not vanity |
|---|-----------|----------------------------|-----------------------------------|
| BO-1 | Prove daily-utility habit in one zone | Retention: users returning to check a route ≥3 distinct commute days/week | Emergency-only use = no dataset = no asset. Habit is the moat. |
| BO-2 | Reach cold-start data density | Contribution density: fresh segment reports per zone per week | Below usefulness threshold, the map is worthless. This is the make-or-break number. |
| BO-3 | Demonstrate behavior change | Self-reported route changes made because of the guide | The only proof the product creates real value, not interest. |
| BO-4 | Secure one institutional commitment | ≥1 LGU / operator / grant letter of intent within the validation window | Converts "nice project" into a business. Currently zero. |

> Revenue is deliberately deferred. Sustainability via institutional funding is a **hypothesis**,
> not a plan (§8, §5). BO-4 is the objective that turns this from a demo into a company.

## Scope

### In scope
- One commute zone only: the PUP Sta. Mesa corridor (LRT-2 Pureza/Legarda, Pureza/Magsaysay
  jeepney routes, Teresa Street). Single-zone density before any expansion (§10).
- The women wedge (students 18–24) as the primary community; LGBTQ+/trans riders as same-problem
  co-beneficiaries (§2).
- Preventive, pre-trip information across the first/last mile (§6).

### Out of scope (mirrors `idea.md` §10)
- Real-time rescue, SOS, or any in-the-moment intervention promise.
- Metro-wide coverage before Sta. Mesa is proven.
- Accessibility routing for seniors/PWDs (different problem, v2 — `F-102`).
- A finished B2B/B2G compliance product (that's the *sustainability story*, not the MVP build).
- Any always-listening / audio-detection capability.

## Stakeholders

| Stakeholder | Interest | Decision authority |
|-------------|----------|--------------------|
| Women commuters (PUP students) | Get safer, cheaper commutes; contribute reports | The *users* — they decide if it lives (usage) but are **not the payers** |
| LGBTQ+/trans riders | Same avoidance problem; legally co-protected (RA 11313) | Co-beneficiary users |
| LGUs (GAD budget holders) | Mandated gender-and-development spend; visible safety wins | **Candidate payer** — none engaged yet |
| Transport operators / LTFRB | RA 11313 liability exposure; compliance evidence | **Candidate payer** — none engaged yet |
| Grant funders | Women's-safety / civic-tech mandates | **Candidate payer** — none engaged yet |
| Build team | Ship MVP; win SparkFest; decide the wedge post-July 2 | Product & scope decisions |

## Success metrics

Business-level (not signups/views):
- **Activation:** % of new users who check a route AND submit ≥1 report in week one.
- **Retention:** % returning ≥3 distinct commute days/week (habit, not emergency-only).
- **Contribution density:** fresh reports/zone/week — the value that beats a cold-start map.
- **Behavioral proof:** self-reported route changes attributable to the guide.
- **Business viability (BO-4):** ≥1 institutional letter of intent.

## Timeline

| Milestone | Target | Assumption |
|-----------|--------|------------|
| MVP live for SparkFest elimination | July 2, 2026 | Build complete, Firestore rules deployed |
| First-party validation (interviews + field-walks) | Immediately post-July 2 | Access to PUP students confirmed via subreddits (§5) |
| Wedge decision (women-led vs all-commuters) | Post-July 2, with real input | Do NOT resolve from desk research (§7 open decision) |
| First institutional conversation | Validation window | Requires the dataset/behavioral proof to have a pitch |

## Budget / cost-benefit

- **Cost:** near-zero infra by design — Firebase Spark (free), Vercel + Render (free tiers),
  keyless MapLibre/OpenFreeMap tiles, a keyless client-side routing engine (ADR-0003), capped
  Gemini usage (ADR-0002). Main cost is **team time** for manual data-seeding and field validation.
- **Value:** unproven. Institutional band cited is ₱10M–₱100M (§5) but is **order-of-magnitude
  reasoning, not a validated pipeline**. Do not present it as a forecast.

## Constraints

- **Regulatory:** publishing segment-level "danger" data risks defamation/privacy liability and
  unlawful neighborhood profiling — must stay on *fixable/observable conditions only* (lighting,
  crowd, recent incident). This is a hard product rule (BR-001), not a preference.
- **Technical:** two-sided cold-start — the map is useless until contribution density crosses a
  usefulness threshold in the single zone.
- **Data trust:** AI structures/deduplicates reports but must never invent incidents (BR-006).

## Risks

| Risk | From | Mitigation |
|------|------|------------|
| **Riskiest assumption (§9):** women won't consult a guide before commuting, or won't contribute enough | `idea.md` §9 | The substitute test post-July 2 — does she open a map, or just ask the group chat? |
| No institutional payer commits in the validation window | §5, §9 unit-economics kill criterion | Keep infra cost ~zero so runway isn't gated on revenue; pursue BO-4 early |
| Segment-level data triggers defamation / profiling liability | §9 regulatory kill criterion | Conditions-only design; kill/redesign trigger already defined |
| Cold-start density unreachable without unscalable manual seeding | §9 technical kill criterion | Do-things-that-don't-scale seeding is acceptable *to learn*; if it can't taper, stop |

> **Kill criteria are live** (§9): regulatory liability, no institutional payer within the window,
> or unreachable density each trigger a stop-or-redesign. This BRD does not soften them.
