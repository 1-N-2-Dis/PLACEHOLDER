---
status: draft
schema_version: 1.1.0
---

<!--
  idea.md — FMD input brief (schema v1.1.0). Frontmatter above is the machine-
  readable handshake (status + schema_version); FMD reads schema_version to pin
  section-schema compatibility. FMD consumes this brief as-is — no validation,
  no evidence floor, no freeze gate (FMD ADR-0002). Any sources cited below are
  optional grounding, not a gate.
-->

# Idea: Safer-route awareness for women commuting the Sta. Mesa commute zone

## 1. Problem statement

A woman studying at PUP Sta. Mesa who finishes an evening class has no reliable
way to know, before she sets out, which stretches of her commute are dangerous
tonight — which jeepney route is running half-empty, which stretch of Teresa
Street has no working lights, which station approach has been the site of recent
snatching or groping. The knowledge that would keep her safe exists, but it
lives scattered in private group chats, in a friend's memory, or only in her own
body after something has already happened to her. Official records capture an
incident only on the rare occasion it is formally reported and prosecuted, so
the danger stays invisible until it is too late. The entire burden of predicting
and avoiding harm falls on her: she re-routes, pays extra to escape, travels in
groups, or simply stays home. She carries this cost daily, alone, and it
quietly shrinks where and when she is willing to go.

## 2. Target segment

Women students aged 18–24 at PUP Main Campus (Sta. Mesa, Manila) who commute the
Sta. Mesa commute zone daily — LRT-2 Pureza/Legarda, jeepney routes along Pureza and
Magsaysay, and the walk along Teresa Street — and especially those traveling
after evening classes. A findable person this week: a 2nd-year PUP student who
rides LRT-2 to Pureza, then walks Teresa Street home after a 7pm class.

Secondary segment (same problem — harassment-driven avoidance): LGBTQ+ riders,
particularly transgender women, in the same commute zone. Out-of-scope-for-now
adjacent group (different problem — physical accessibility, not harassment):
senior citizens and PWDs.

## 3. Evidence

- Women change the routes they travel specifically to avoid harassment and
  assault, and existing mapping tools do not give them the information to do it.
  (arXiv-1811.01147, route-safety study, 2018-11-03)
- Filipino women on Metro Manila transit run continuous self-protection routines
  ("modified feminist self-defense") because the system provides no security.
  (Springer-12198-023-00268-y, 2023-10-31)
- A Quezon City woman re-routes and takes longer walks to avoid groups of men,
  and at times avoids leaving home at all.
  (UN-Women-QC-SafeCities, 2015-12-08)
- Commuters in this zone use concrete manual workarounds: bag held in front on
  the train, boarding only half-full jeepneys, traveling in groups on Teresa St.
  (reddit-HowToGetTherePH-workarounds, 2024-03-01)
- Women spend extra money to escape danger entirely — paying Angkas/MoveIt surge
  fares for late-night trips, and some relocate housing to avoid the commute.
  (reddit-HowToGetTherePH-paid-avoidance, 2023-09-01)
- Commuters already crowdsource danger-area knowledge by hand, asking and
  answering which Metro Manila areas to avoid after dark.
  (quora-metro-manila-after-dark, 2025-09-07)
- All transgender-woman participants in an MRT study reported experiencing
  sexual harassment in some form.
  (Trans-on-Trains-MRT-study, 2016-02-21)
- Filipino women report rising anxiety about walking alone at night, with
  confidence down ~11% since 2024.
  (PSRC-Worldviews-2026, 2026-02-01)

## 4. Root cause (the WHY)

- Symptom: women get harassed on the commute and can't avoid it.
- Why? They don't know which specific segments are dangerous before they travel.
- Why? Local, current safety knowledge isn't aggregated anywhere — it sits in
  memory and private group chats.
- Why? No one owns first/last-mile safety information; official channels are
  reactive and enforcement-focused, activating only after a formal complaint.
- Why? Incidents are massively underreported (about half of victims do nothing),
  so danger never becomes visible data the system can act on.
- Structural root cause: safety is privatized to each individual woman, and the
  only record the system keeps is the tiny fraction of incidents that survive to
  prosecution — so the lived danger map is never written down.

Why still unsolved: existing safety maps are global and have no local density to
be useful in one zone; women-only train cars protect only the rail leg and
ignore the first/last mile where exposure is highest; panic and reporting tools
assume a real-time rescue that cannot physically happen on a moving vehicle.

## 5. Market & alternatives

- PUP Main Campus enrolls roughly 83,000 students (2023); at gender parity that
  is about 41,000 women navigating the Sta. Mesa commute zone.
  (PUP-enrollment-2023, 2023-09-01)
- NCR college enrollment includes about 363,000 women, a broader reachable base.
  (CHED-AY2020-2021, 2021-06-01)
- The three rail lines carry ~1.01M trips daily (MRT-3 ~375k, LRT-2 ~149k, LRT-1
  ~486k); at ~50% female that is roughly 350k–500k women daily.
  (DOTr-rail-ridership, 2024-12-31)
- The segment is reachable this week in two open channels: r/HowToGetTherePH and
  the PUP campus subreddits (r/PUPians, r/SintangPaaralan).
  (reddit-channels-observed, 2026-06-30)
- Alternative "do nothing / hypervigilance": the incumbent; its failure is that
  it loads the entire cognitive and safety burden on the victim and still fails
  in packed, inescapable vehicles.
  (Springer-12198-023-00268-y, 2023-10-31)
- Alternative women-only train cars: failure is journey-myopia — they cover only
  the rail segment and leave the first/last mile unprotected.
  (market-research-transit-safety, 2026-06-30)
- Alternative ride-hailing (Grab/Angkas): failure is economic exclusion — surge
  fares are prohibitive for daily student use.
  (reddit-HowToGetTherePH-paid-avoidance, 2023-09-01)

Who pays (price question, reasoning — not a validated claim): the female
commuter has weak willingness to pay for information that can't physically move
her; the realistic payers are LGUs (mandated GAD budgets), transport operators
facing RA 11313 / LTFRB liability, and grants. Order-of-magnitude institutional
band is ₱10M–₱100M, but no payer has committed and this is unproven until tested.

## 6. Value proposition

For women students commuting the Sta. Mesa commute zone who must guess which routes are
safe before they travel, this is a community-sourced safer-routing guide that
shows which segments to avoid tonight and why, before they leave — unlike
women-only train cars (which cover only the rail leg) or panic-button apps
(which assume a rescue that can't happen), because it works preventively across
the first and last mile, structuring the route-safety crowdsourcing women
already do by hand.

## 7. Feature set

**MVP** (each feature names the problem it solves):
- **F-001** — Zone safety map with crowdsourced segment flags — solves "danger
  knowledge is scattered and invisible" (§1, §4).
- **F-002** — One-tap report of a route/segment condition (poor lighting, no
  crowd, recent incident) — solves "lived danger is never written down" (§4).
- **F-003** — Pre-trip "is my route okay tonight" check for the zone — solves
  "no way to know before setting out" (§1).
- **F-004** — Structured, deduplicated risk summary from free-text reports —
  solves "crowd noise isn't trustworthy signal" (§5 alternatives gap).
- **F-005** — Severity-tiered, multi-route (2-3 alternative) recommendation —
  solves "one route recommendation hides the safety-vs-directness tradeoff"
  (added during build, 2026-07-01).
- **F-006** — AI report classification + moderation (server-side) — solves
  "crowd noise and false reports need filtering before they reach the map"
  (added during build, 2026-07-01).
- **F-007** — Photo evidence on reports (Firebase Storage, EXIF-stripped) —
  solves "a text-only report is harder to trust and act on" (added during
  build, 2026-07-01).
- **F-008** — AI-assessed "is my route safe tonight?" for the recommended route
  — solves "the pre-trip check was disconnected from the actual route being
  taken" (added during build, 2026-07-01).

**Final**:
- **F-101** — Expansion to additional campus commute zones with enough
  contributor density.
- **F-102** — Inclusive-routing layer (well-lit / step-free options) for
  LGBTQ+, senior, and PWD riders.
- **F-103** — Closed-loop reporting that routes a structured complaint to the
  right LGU/operator desk under RA 11313.

### Initial map seed pins (PROVISIONAL — unverified, confirm post-July 2)

> These are starting map content for the MVP, NOT confirmed facts. Every pin
> below is a lead from the Sta. Mesa hyperlocal deep-research — unverifiable
> permalinks and synthetic dates — so none belongs in §3 as a sourced claim.
> Treat each as a "confirm or kill" hypothesis to test in live interviews and
> field-walks after July 2. Conditions are described as fixable/observable
> states (lighting, crowd, pavement) — not as neighborhood "crime zone" labels,
> per the §9 profiling kill-criterion. Target segment is unchanged (women wedge);
> these pins describe conditions any commuter can use, but who we build/pitch
> for is not widened here.

| # | Segment | Condition to flag | Behavior observed (to confirm) |
|---|---------|-------------------|--------------------------------|
| 1 | Teresa St (PUP side) | dark/thin foot traffic at night; snatch/holdup reputation; mud + makeshift bridges | walk in groups, bag on chest, fast pace after dark |
| 2 | Pureza LRT-2 south exit (Jollibee/Chowking side) | opportunistic pickpocketing, often by minors | separate phone from wallet/transit card |
| 3 | Pureza station approaches | poorly lit after dark | avoid lingering, avoid unknown approachers |
| 4 | Legarda east approach / Estero de San Miguel | unlit blind spot along the estero after sunset | avoided after dark |
| 5 | Recto–Legarda environs | flagged unsafe pre-dawn (≈3–5 AM), esp. for women | pay moto-taxi rather than walk |
| 6 | V. Mapa → SM Sta. Mesa | walkable by day; footbridge poorly lit / occupied | walk street-level, avoid the overpass |
| 7 | P. Campa / Loyola / Dalupan / San Anton / Figueras | quieter alt-route used to bypass Recto | deliberately route around the main drag |
| 8 | Magsaysay Blvd / Old Sta. Mesa jeepney routes | jump-in snatch/holdup risk, worst on half-empty units at night | board fuller jeeps only; no phone near the open window |

> Open decision (do not resolve from desk research): whether "danger" stays
> harassment-led (women wedge) or widens to all-crime/all-commuters. Widening
> changes §2/§5/§6 and the payer story — make it after July 2 with real input.

## 8. Success metrics

- Activation: % of new users who check a route AND submit ≥1 report in week one.
- Retention: % who return to check a route on ≥3 distinct commute days per week
  (daily-utility habit, not emergency-only).
- Contribution density: number of fresh segment reports per zone per week
  (the value that beats a cold-start map).
- Behavioral: self-reported route changes made because of the guide.
- (Revenue deferred; sustainability via LGU/operator funding is unproven.)

## 9. Constraints, risks & kill criteria

**Single riskiest assumption:** women will consult a guide before commuting AND
enough of them will contribute reports to make it useful in the zone. If
they instead "just go," or contribution density never reaches usefulness, the
core thesis fails.

**Kill criteria (explicit fail-states):**
- Regulatory: if publishing segment-level "danger" data exposes the team to
  defamation/privacy liability or is found to unlawfully profile neighborhoods,
  stop and redesign around fixable conditions only (lighting, crowd, lit/unlit).
- Unit economics: if no institutional payer (LGU/operator/grant) commits within
  the validation window and per-user infra cost can't be covered, stop.
- Technical: if crowdsourced reports can't reach usable density in one zone
  without manual seeding that doesn't scale, stop and rethink the wedge.

## 10. Out of scope (for now)

- Real-time rescue, SOS dispatch, or any promise of in-the-moment intervention.
- Metro-wide coverage before the single Sta. Mesa commute zone is proven.
- Physical-accessibility routing for seniors/PWDs (different problem; later).
- A B2B/B2G compliance product for transport operators (sustainability story,
  not the MVP build).
- Audio/scream detection or any always-listening capability.
