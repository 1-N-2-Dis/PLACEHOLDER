# Mentor synthesis — Jerico (business) + Troy (built the near-twin), reconciled

> Purpose: two mentors gave overlapping and, in one place, *conflicting* advice. This reconciles
> them into a single guidance set the team can act on without confusion. Where they conflict, the
> tie-breaker is stated with a reason. Sources: Carlos Jerico Dela Torre (business coaching
> session) and Troy (creator of [ALAITAPTAP](https://github.com/Troy-LL/ALAITAPTAP), interviewed).
> Companion to [competitive-analysis.md](./competitive-analysis.md) (the ALAITAPTAP teardown +
> comparison). The interview method is archived in the appendix below.

## 1. Where they agree — reinforce, no debate

- **Free to users; revenue from institutions (B2G/B2B2C).** Jerico said it outright; Troy's model
  implicitly confirms consumers won't pay. Locked.
- **Localized dataset is the competitive edge; Safetipin is the only close analog.** Both agree.
- **Show the tradeoff, don't over-promise.** Jerico: safety-over-speed as USP. Troy: always show the
  alternative route even if worse. Same principle.
- **Be transparent and defensible about data.** Both, in different words.

## 2. The one real conflict — and the ruling

**Jerico suggested** an ML layer that auto-scrapes the web to find/validate danger locations so you
can scale beyond PUP and reduce the crowdsourcing burden.

**Troy — who actually built exactly that — walked us off it.** In the interview he said twice that a
hyperlocal project like ours **doesn't need synthetic crime data** ("being localized na, I don't
think you'd need much data"; "considering you have those options I don't think you'd need synthetic
data for crime reports"). He also named its failure mode himself: synthetic data **"overloads the
scorecard"** (over-labels an area as too unsafe), and his only fix was "increase variance" — i.e.,
add noise to hide the distortion, not make it true.

**Ruling: Jerico's ML-scraping suggestion is DOWNGRADED to optional/rejected for us.** Reasons:
1. Troy, the one person who shipped it, says we don't need it when hyperlocal.
2. It reintroduces crime-labeling → our BR-001 defamation/profiling kill-criterion, and we operate
   in ONE identifiable zone where that risk is real (Troy could shrug metro-wide; we can't).
3. It erases our moat — synthetic scraped danger data is the competitor's exact weakness.
4. It turns Gemini into "AI theater" instead of the trust role we designed.

**What we keep instead:** scraping for **cold-start seeds only, framed as hypotheses to validate**;
Gemini in the **trust role** (structure, deduplicate, classify *real* reports — F-006/BR-006);
positive-signal enrichment (below) to make the map useful before crowd density arrives.

## 3. Jerico's advice — item-by-item status

| Advice | Status | Note |
|--------|--------|------|
| B2B2C/B2G, free to users, grants (LGU/GAD/LTFRB) | **Keep** | PUP's own GAD office = warmest customer #1 |
| "Signal of commitment" from an institution first | **Keep** | This is BRD BO-4 |
| Build the Business Model Canvas, lock value prop/segments/partners | **Keep** | Alex owns; see pitch kit |
| Start B2C-free to gather data, then approach institutions with proof | **Keep** | Best strategic note of the session; = "make something people want first" |
| ML auto-scraping to scale data / avoid crowdsourcing | **Revised → rejected** | Overruled by Troy + our thesis (§2) |
| Pitch: 5 min, problem-solution-value, demo video, 1–2 speakers, assign Q&A | **Keep** | See pitch kit |
| Branding: don't look like a generic AI product | **Keep** | Helena; trust-first, no AI-purple, no emoji |
| Google One Tap sign-up | **Keep (small)** | You already have Firebase Auth (Google sign-in); low effort |
| CI/CD token tools (e.g. in pipeline, not IDE) to save cost | **Keep (later)** | Post-pitch; not tonight |
| pagespeed / web.dev perf check | **Keep (later)** | Nice-to-have, not demo-critical |
| Expand scope to all Manila/NCR + seniors/LGBTQ/men | **Revised → hold** | Roadmap slide only; single-zone + women wedge for the pitch |

## 4. Troy's advice — item-by-item status

| Advice | Status | Note |
|--------|--------|------|
| Don't force routes; the normal route is usually safest; **2 routes max** | **Adopt** | Revises F-005 (was 2–3) — cap at 2 |
| Always show the alternative even if worse (proves the engine works) | **Adopt** | UX + credibility |
| "Recommended" = the safest path *we* compute (not gmaps/fastest) | **Adopt** | Clarify in PRD + UI copy |
| Biggest regret: fragile microservice backend for routing | **Adopt** | Fixes our pin-loading bug — keep demo-critical path off cold-starting services |
| Safe-space POIs (stores/police/lit spots), time-of-day, foot/traffic proxy | **Adapt** | As positive/observable signals, verified; not crime labels |
| CCTV as a data point | **Reject** | Unverifiable |
| Synthetic crime data + ML manufacture | **Reject** | §2 |
| Defamation posture ("totoo naman, just defend it") | **Reject** | Fine for a demo, liability for our real hyperlocal product; conditions-only is our shield |
| "AI framing survived judges" | **Context only** | It survived because unpoked; keep our AI real (trust role) |

## 5. Net reconciled guidance (the short list the team acts on)

1. Free to users; institutions pay; PUP-GAD is customer #1; goal = one signal of commitment.
2. Single zone + women wedge for the pitch; expansion is roadmap only.
3. Conditions-only data. Seeds = hypotheses. Gemini = trust role, never manufacture.
4. Routing: 2 routes max, recommend the safest computed path, always show the alternative.
5. Demo-critical path must render without waiting on a cold-starting microservice.
6. Enrich with verified positive signals (safe spots, lighting, crowd, time-of-day).
7. Pitch: 5 min, problem-solution-value, demo video fallback, assigned Q&A owners.
8. Branding: trust-first, no AI-purple, no emoji.

## 6. Tools & skills the mentors introduced (consolidated)

> Pulled together from the sessions as recorded across the docs. **This section is known to be
> incomplete** — the team recalls more tools/skills that were mentioned but never written down.
> Items under "To confirm" are placeholders for the team to fill; **nothing here is invented.**
> Owner for capturing the rest: whoever was in the session (Alex/Helena). Add specifics, then
> promote them into the table.

### Introduced and adopted / planned

| Tool or skill | From | What it's for | Status |
|---------------|------|---------------|--------|
| **Business Model Canvas** | Jerico | Lock value prop, segments, partners, payer on one page | **Done** — [pitch kit §2](./alex-pitch-kit.md) |
| **Google One Tap sign-up** | Jerico | Lower-friction auth on top of existing Firebase Google sign-in | Optional, low-effort — [BUILD-GUIDE, Jim](../BUILD-GUIDE.md) |
| **PageSpeed / web.dev check** | Jerico | Front-end performance audit | Later (not demo-critical) |
| **CI/CD token tooling (in pipeline, not IDE)** | Jerico | Cut AI/token cost during build | Later (post-pitch) |
| **Safe-space POIs + time-of-day + foot-traffic signals** | Troy | Positive/observable enrichment so the map is useful before crowd density | Adapt (conditions, never crime labels) — [BUILD-GUIDE, Farhana](../BUILD-GUIDE.md) |
| **ORS alternative-route UX** | Troy | Proven routing surface (show the alternative even if worse) | Adopted into F-005 |
| **Cold-start seeding method** | Troy | How he made an empty map useful on day one | Learn the *method*, keep our bottom-up data — [competitive-analysis](./competitive-analysis.md) |

### To confirm (team to fill — do not guess)
The team recalls additional **skills/tools** mentors demonstrated that aren't captured. Likely
candidates to write up (confirm who introduced each and the exact tool/name before adding above):
- UI/UX + branding guidance — **Ate Ayen** and **Kuya Troy** (Helena is reaching out; see
  [BUILD-GUIDE, Helena](../BUILD-GUIDE.md)). Capture their concrete suggestions here after the call.
- Any specific design tools (e.g. a design-taste workflow, component library, or Figma/AI-UI tool)
  named in the sessions — **needs the team's notes**; not recorded anywhere yet.
- Any dev/agent tooling or "skills" a mentor pointed to beyond the CI/CD token note above.

> Action: Alex/Helena, dump the raw list of tools/skills the mentors mentioned (even one word each)
> and this section gets promoted from placeholders to a real record. Until then it is marked incomplete.

## Appendix — Troy interview method (archived; interview done 2026-07-05)

Folded in from the former `troy-question-guide.md`. Kept as a record of what we asked and the
principle behind it; the *answers* are reconciled in §2–§5 above.

**Principle:** Troy's scarcest resource is time; his value is first-hand experience of the exact fork
we chose the other side of. Ask about judgment and hindsight (not facts in the repo): open with a
30-second summary of his project to prove homework, lead with our specific decisions, then ask him to
pressure-test them. Treat "your thesis is wrong" as data, not attack.

**The 5 questions that mattered:**
1. **Cold-start** — with *real* crowdsourced reports instead of scraped/synthetic data, how do you
   get the map dense enough to be useful before people give up on an empty map? (our riskiest assumption)
2. **Crime-label fork** — you labeled areas by crime type; we banned it for defamation/profiling risk
   (BR-001). Did the labels ever cause trouble? Would you keep them?
3. **"AI" reality check** — your score was a formula on synthetic data; did judges/users buy the "AI"
   framing or poke it? How much did the AI story matter vs the map just being useful?
4. **Did anyone actually use it?** — real women, real reports, retention after the competition? What
   killed momentum? (separates "built a demo" from "made something people want")
5. **SOS decision** — you shipped a buddy-alert SMS; we banned rescue/SOS (BR-002). Did users expect
   it to save them? Did it create a false sense of safety?

**Discipline that transfers to any mentor/judge conversation:** show the homework, ask experience not
facts, prioritize ruthlessly (~5 real questions in 20 min), write answers verbatim same-day, and send
a thank-you naming the one thing you'll change because of them.
