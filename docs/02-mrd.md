# MRD — Market Requirements Document

> ⚠️ PROVENANCE: Generated from `docs/idea.md` (status: draft) + `docs/evidence-register.md`.
> Evidence is **desk research and leads, not validation** — `said` never validates; `did`/`paid`
> from third-party sources are leads until a first-party interview confirms them. Market size is
> top-of-funnel `[said]`. No facts fabricated. Traces to `idea.md` §2, §5.

## Market problem

Women commuting the Sta. Mesa zone have no reliable way to know, *before they set out*, which
stretches of tonight's commute are dangerous — which jeepney is running half-empty, which stretch
of Teresa St has no working lights, which station approach has recent snatching. The knowledge
exists but lives in private group chats, a friend's memory, or a woman's own body after harm has
already happened. The full burden of predicting and avoiding harm falls on her: she re-routes,
pays surge fares to escape, travels in groups, or stays home (`idea.md` §1). ~85% of women report
changing route to avoid harassment, and existing mapping tools don't help them do it
(arXiv-1811.01147, `[did]`).

## Segments & personas

**Primary — women students, 18–24, PUP Main Campus.** Commute the zone daily (LRT-2 Pureza/Legarda,
Pureza/Magsaysay jeeps, Teresa St walk), especially after evening classes. *Findable this week:* a
2nd-year PUP student who rides LRT-2 to Pureza, then walks Teresa St home after a 7pm class.
Current behavior: continuous self-protection routines — bag on chest, board only fuller jeeps,
travel in groups (Springer-12198, reddit-workarounds; `[did]`, in-zone).

**Secondary — LGBTQ+/trans riders (same problem).** All transwoman participants in an MRT study
reported harassment (Trans-on-Trains, `[did]`); legally co-protected under RA 11313. Same
avoidance behavior, same commute zone — a natural co-beneficiary, not a separate build.

**Adjacent, out-of-scope-for-now — seniors/PWDs (different problem: accessibility, not
harassment).** ~80% of MRT/LRT stations aren't PWD-accessible (Rappler, `[did]`). This is the v2
inclusive-routing vision (`F-102`), not MVP.

## Market size

| Band | Figure | Method / source | Tag |
|------|--------|-----------------|-----|
| Beachhead (one campus) | ~41,000 women | PUP Main ~83,000 students at gender parity (PUP-enrollment-2023) | `[said]` |
| Reachable base (NCR) | ~363,000 women | NCR college enrollment, women (CHED-AY2020-2021) | `[said]` |
| Top-of-funnel (rail) | ~350k–500k women/day | 3 rail lines ~1.01M trips/day at ~50% female (DOTr-rail-ridership) | `[said]` |

> All sizing is `[said]` top-of-funnel — it measures *presence in the zone*, not *demand for this
> product*. Do not confuse reach with willingness to use or pay.

## Competitive landscape

| Alternative | Strength | Key failure (the gap we exploit) |
|-------------|----------|----------------------------------|
| **Do nothing / hypervigilance** (the incumbent) | Free, always available | Loads the entire cognitive + safety burden on the victim; still fails in packed, inescapable vehicles |
| **Women-only train cars** | Real protection on rail | Journey-myopia — cover only the rail leg, ignore the first/last mile where exposure is highest |
| **Ride-hailing (Grab/Angkas)** | Physically removes her from danger | Economic exclusion — surge fares are prohibitive for daily student use |
| **Panic-button / SOS apps** | Feels reassuring | Assume a real-time rescue that can't physically happen on a moving vehicle |
| **Manual group-chat crowdsourcing** | Trusted, hyperlocal, current | Unstructured, ephemeral, invisible to newcomers — the behavior we structure |

**The gap:** nobody provides *preventive, pre-trip, first/last-mile* safety information built from
the crowdsourcing women already do. That's the wedge.

## Positioning

For women students commuting the Sta. Mesa zone who must guess which routes are safe before they
travel, SaferRoute is a **community-sourced safer-routing guide that shows which segments to avoid
tonight and why, before they leave** — unlike women-only cars (rail-only) or panic apps (rescue
that can't happen), because it works **preventively across the first and last mile**, structuring
the route-safety crowdsourcing women already do by hand (`idea.md` §6).

## Pricing hypothesis

- **Anchor (what the segment pays today):** surge fares to Angkas/MoveIt, and some relocate housing,
  to *escape* unsafe commutes (reddit-paid-avoidance, `[paid]`). **Critical caveat:** this is
  willingness to pay to be *moved*, not to *know*. It does **not** validate WTP for an information
  product.
- **Consumer price hypothesis:** ~₱0. The woman commuter has weak WTP for information that can't
  physically move her (§5).
- **Institutional price hypothesis:** the real payer is B2G/B2B — LGUs (mandated GAD budgets),
  operators (RA 11313 / LTFRB liability), grants. Order-of-magnitude band ₱10M–₱100M (§5).
  **Hypothesis only — no payer has committed; unproven until tested.**

## Go-to-market notes

- **Reachable this week (2+ open channels):** r/HowToGetTherePH and PUP campus subreddits
  (r/PUPians, r/SintangPaaralan) (reddit-channels-observed, `[verified]`).
- **Search/ask behavior to meet:** active public threads asking "is `<route>` safe at night" and
  which areas to avoid after dark (quora, reddit; `[did]`) — demand signal to intercept.
- **The cold-start reality:** value is two-sided — the map is useless until contribution density
  crosses a usefulness threshold in the one zone. GTM must manufacture early density
  (do-things-that-don't-scale), not just acquire users. See [GTM](./13-release-gtm.md).
