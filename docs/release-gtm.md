# Release / Go-to-Market & Roadmap

> ⚠️ PROVENANCE: Generated from `idea.md`, [BRD](./01-brd.md), [MRD](./02-mrd.md),
> [PRD](./prd.md). Business context: SparkFest MVP (elimination July 2). Demand unvalidated;
> growth plan is a hypothesis to test, not a forecast. No facts fabricated.

## Release plan & phases

| Phase | Goal | Entry criteria | Exit criteria |
|-------|------|----------------|---------------|
| **P0 — SparkFest MVP** | Demoable single-zone guide | Build complete; Supabase client-write denial and server report path verified | Live map + report + pre-trip check working for the Sta. Mesa zone |
| **P1 — Validation (post-July 2)** | Answer the riskiest assumption | MVP live; PUP students reachable via subreddits | The **substitute test** answered: does she open the map, or just ask the group chat? |
| **P2 — Density** | Cross the cold-start usefulness threshold in one zone | Validated that women *will* consult + contribute | Contribution density (reports/zone/week) sustains without unscalable seeding |
| **P3 — Payer proof** | Turn the dataset into a business | Behavioral proof (route changes) + density | ≥1 institutional letter of intent (LGU / operator / grant) |
| **P4 — Expansion (Final)** | Second zone only after the first is proven | P2 + P3 met | `F-101` additional campus zones |

> Phases are gated by *learning*, not calendar. A failed gate triggers the matching **kill
> criterion** (`idea.md` §9), not a push to the next phase.

## Rollout / rollback strategy

- **Ship:** static SPA on Vercel; server routes on Render; Firebase Auth/role records and
  Supabase report data (ADRs 0002 and 0004).
- **The one hard gate:** keep Supabase client writes denied and verify `submitReport` against the
  intended environment before changing RLS or server credentials. That is the rollback-sensitive step.
- **Feature disable:** photo upload is already flag-gated off (`PHOTO_UPLOAD_ENABLED = false`), so
  `F-007` can stay dark without a redeploy.

## Launch checklist

- [ ] Build passes, tests pass; every code change ties to an `F-###` with a QA test.
- [ ] Supabase RLS denies client `reports` writes; Firestore rules protect role records; Storage
      rules are N/A while Storage is disabled.
- [ ] Report writes are server-side + auth-gated (`submitReport`); Gemini key + service-account key
      server-side only (Render).
- [x] ~~ORS client key origin-restricted + usage-capped~~ — **N/A (ADR-0003):** routing has no client-side key anymore.
- [ ] Business-rule sign-off: no SOS/rescue copy (BR-002), single zone (BR-003), condition-only
      data (BR-001), no crime-zone/neighborhood labels, EXIF stripped where photos re-enable (BR-008).
- [ ] Seed pins loaded as **"confirm-or-kill" hypotheses**, not stated facts (Tier B, unverified).

## GTM channels

From [MRD](./02-mrd.md) — reachability confirmed:
- **Owned/community (primary):** r/HowToGetTherePH, r/PUPians, r/SintangPaaralan; PUP student orgs
  and women's/gender groups on campus.
- **Intercept existing demand:** answer live "is `<route>` safe at night" threads with the guide.
- **Do-things-that-don't-scale (the density engine):** hand-seed the first reports by walking the
  8 candidate segments, recruit a small cohort of PUP evening commuters directly, and personally
  onboard early contributors. Manual by design in P1–P2 — the point is to learn, not to scale yet.
- **Earned (later):** campus press / gender-desk coverage once behavioral proof exists.
- **Institutional (P3):** direct outreach to the LGU GAD desk and transport operators, carrying the
  dataset + RA 11313 liability framing — not before there's proof to show.

## Success metrics & instrumentation

| Metric (`idea.md` §8) | Instrumented as | What it proves |
|-----------------------|-----------------|----------------|
| Activation | % of new users who check a route AND submit ≥1 report in week one | The loop closes for a real user |
| Retention | % returning ≥3 distinct commute days/week | Daily-utility habit, not emergency-only |
| Contribution density | fresh reports/zone/week | The cold-start value that beats an empty map |
| Behavioral | self-reported route changes because of the guide | Real value, not interest |
| Business viability | ≥1 institutional LOI | The business exists |

## Post-launch learning loop

- **Watch weekly:** contribution density and the check→report activation funnel.
- **The decisive test (P1):** the substitute test — map vs group chat (§9 riskiest assumption).
- **The open decision:** wedge stays harassment-led (women) vs widens to all-crime/all-commuters —
  decide **with real input after July 2**, never from desk research (`idea.md` §7). Widening changes
  segment, market, value prop, and the payer story.
- **Cadence:** review against kill criteria every phase gate; a missed gate stops or redesigns.

## Roadmap beyond MVP

Scaffolding, not commitments (`idea.md` §7 Final):
- **F-101** — expansion to additional campus commute zones once density is proven.
- **F-102** — inclusive-routing layer (well-lit / step-free) for LGBTQ+, senior, PWD riders.
- **F-103** — closed-loop reporting routing a structured complaint to the right LGU/operator desk
  under RA 11313 (the seed of the institutional product).
