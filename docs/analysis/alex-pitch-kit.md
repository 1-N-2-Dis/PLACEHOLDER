# GuidHer pitch kit — narrative, BMC, 5-min script, Q&A map, interview probe sheet

> Everything Alex owns for the final pitch, in one file. This is the **filled-in instance** of the
> method in [pitch-deck-playbook.md](./pitch-deck-playbook.md) (VC deck structure, re-weighted for
> the SparkFest rubric). Grounded in [idea.md](../idea.md), [BRD](../01-brd.md), [MRD](../02-mrd.md),
> and [mentor-synthesis.md](./mentor-synthesis.md).
>
> **Product name:** **GuidHer** (public name — README, live demo, repo). Internal FMD docs still say
> "SaferRoute Sta. Mesa" pending a global swap; use **GuidHer** everywhere judge-facing.
>
> **Format & scoreboard:** SparkFest final round = **5-min pitch + 15-min Q&A + 5-min prep**, per
> [00-hackathon-context.md](../00-hackathon-context.md) §4. Weights: Technology 25, Relevance 20,
> Creativity 15, Uniqueness 15, Feasibility 15, Presentation 10. The 15-min Q&A is worth more than
> the script — §4 (Q&A map) is the most important section here.

## 1. Business narrative (the one paragraph everyone tells the same way)

GuidHer turns the safety crowdsourcing women already do by hand — in group chats and memory — into a
shared, pre-trip guide for the PUP–Sta. Mesa commute. Before she leaves an evening class, a woman can
see which segments to avoid tonight and *why*, using fixable conditions (lighting, crowd, recent
condition), never crime-zone labels. It's free for the women who use it, because they shouldn't have
to pay for safety; it's funded by the institutions with a mandate to provide it — starting with PUP's
own Gender and Development office. We start in one zone on purpose: trust and density in a place we
know beats a thin map everywhere. The one thing we're proving right now is simple and hard — that
real women will use it, and contribute to it, instead of just asking the group chat.

> Everyone on the team should be able to say this from memory. It is the spine of every slide and
> every Q&A answer.

## 2. Business Model Canvas (one-pager)

> How to read this: the BMC is the *business logic*; the rightmost column says which pitch beat
> (§3) each block feeds, so the canvas and the pitch never drift apart.

| Block | Content | Feeds pitch beat |
|-------|---------|------------------|
| **Value proposition** | Know which segments of your PUP–Sta. Mesa commute to avoid tonight, and why, *before* you leave — community-sourced, conditions-only (lighting/crowd/recent condition), first & last mile. Safety over speed. | Hook + Solution |
| **Customer segments** | **Users:** PUP women commuters 18–24 (primary); LGBTQ+/trans riders (same problem). **Payers (distinct):** PUP GAD office, LGU GAD desks, grants. | Problem + Model |
| **Value proposition → why us** | The verified hyperlocal dataset + community trust is the moat; conditions-only is the legal/ethical shield (BR-001). | Why-now/wedge |
| **Key partners** | PUP GAD office + student orgs; LGU GAD/women's desks; women's organizations. Infra: OpenRouteService, MapLibre/OpenFreeMap, Firebase, Gemini. | Model |
| **Key activities** | Crowdsource + verify reports; keep data trustworthy (Gemini dedupe/classify); run and validate the single zone. | Solution + demo |
| **Key resources** | The verified hyperlocal dataset + community trust (the moat); the team. | Competition |
| **Cost structure** | Near-zero infra (free tiers: Firebase Spark, Vercel, Render, keyless tiles). Main cost = team time for seeding + validation. | Feasibility (replaces "financials") |
| **Revenue streams** | Institutional: GAD budgets, grants. Free to users. Ads rejected (hurts UX + trust). | Model + payer |
| **Channels** | r/HowToGetTherePH, r/PUPians, r/SintangPaaralan; campus orgs. (Lowest priority per Jerico.) | (support) |
| **Customer relationships** | Trust + a contributor feedback loop; do-things-that-don't-scale onboarding. | Ask |

## 3. Five-minute pitch script (timed, mapped to the arc + rubric)

> Arc from [pitch-deck-playbook.md](./pitch-deck-playbook.md) §3: Hook → Problem → Solution+demo →
> Why-now/wedge → Model+payer → Ask. Weight delivery toward Technology (25) + Relevance (20).
> Pre-empt the two point-costing objections inside the pitch (Sequoia habit): "isn't this a crime
> map?" and "is the data real?"

| Time | Beat | What to say | Rubric it feeds |
|------|------|-------------|-----------------|
| **0:00–0:30** | **Problem** | A PUP woman finishing a 7pm class has no way to know, before she leaves, which stretch of her commute is dangerous tonight. That knowledge exists — but it's trapped in group chats and memory. So she re-routes, overpays, or stays home. | Relevance; "problem real?" |
| **0:30–2:15** | **Solution + live demo** | GuidHer structures the crowdsourcing women already do. *Show the core loop live/on video:* open the zone map → see tonight's flagged conditions → one-tap report → route recommendation updates, showing the safest path **and** an alternative. Say it plainly: **conditions, not crime labels** (pre-empts objection #1). | **Technology (25) + Feasibility (15)** |
| **2:15–3:15** | **Why now / wedge** | RA 11313 (Safe Spaces Act) makes commute harassment a named priority. We start hyperlocal at PUP because trust and density beat a thin metro-wide map. Gently contrast: generic safety maps are global and empty; scraped crime maps profile places. We're deep in one zone, and our AI only structures **real** reports — it never invents danger (pre-empts objection #2). | Creativity + Uniqueness (30) |
| **3:15–4:15** | **Model + payer** | Free to women — they shouldn't pay for safety. We fund it through institutions with a mandate: PUP's own GAD budget first (state universities allocate a Gender-and-Development budget by law), then LGU GAD desks and grants. Near-zero infra cost means it survives on those budgets. | Sustainability |
| **4:15–5:00** | **Ask** | What we need: pilot support, a GAD conversation, mentorship. And the one metric we're chasing this month — **real women contributing and changing routes**, which we're testing this week with interviews. | Presentation close |

> Delivery rules (Jerico + playbook §5): concise, no rambling; 1–2 speakers; big text/few words;
> demo video ready as fallback. Rehearse the Q&A more than the script.

## 4. Q&A ownership map (the 15 minutes that decide it)

> This is where Technology (25) + Relevance (20) are actually scored. Every likely question has a
> named owner and a one-line answer. Owners: **Alex** (business), **Farhana** (AI/data),
> **Jim** (tech stack/demo). If a question lands cross-owner, the named owner starts and hands off.

| Likely question | Owner | One-line answer |
|-----------------|-------|-----------------|
| "Is your data real / where does it come from?" | Alex | Seed pins are research **hypotheses**, labeled as such; the real data is crowdsourced conditions we validate — we never scrape or assert crime facts. |
| "Isn't this just an AI crime map?" | Farhana | No. AI **structures and dedupes real user reports**; we never label places by crime or profile neighborhoods. That's a hard product rule (BR-001). |
| "Defamation — you're calling a place dangerous?" | Alex | By design we map **fixable conditions** (lighting, crowd), never crime-zone labels. Conditions-only is our legal and ethical shield. |
| "How does the AI actually work? Isn't it AI theater?" | Farhana | Gemini does three real jobs on real reports: severity classification, duplicate merge, spam/troll filtering. It adds no facts (BR-006). |
| "What's your tech stack — and where's the Google technology?" | Jim | React+Vite front; **MapLibre GL + OpenFreeMap** for maps (keyless, non-Google, by choice) and **OpenRouteService** for routing; **Firebase (Auth + Firestore) + Gemini** satisfy the Google-tech requirement; Vercel + Render host it. |
| "Why not just use Google Maps?" | Jim | Deliberate: Google Maps needs billing + a restricted key for a 2-day build, and the Google-tech requirement is already met by Firebase + Gemini. Decision recorded in ADR-0001. |
| "Does the demo/backend scale? What if it's slow live?" | Jim | Single-zone by design; the first screen renders from a static seed module so it never waits on a cold-starting service. We have a video fallback. |
| "Why won't women just use their group chat?" | Alex | That's our riskiest assumption — we're testing it **this week** with real PUP commuters (probe sheet §5). Honest answer: we're proving it now, not claiming it. |
| "How is this different from Google Maps / Safetipin?" | Alex | Preventive, first/last-mile, hyperlocal, conditions-only. Safetipin is the only close analog and it's donor/government-funded — which validates our payer model. |
| "Who pays / is it sustainable?" | Alex | Free to users; PUP GAD budget is customer #1 (state university with a mandated GAD budget); then LGUs and grants. Infra is near-zero cost. |
| "What's your community sector?" | Alex | Women students (18–24) commuting the PUP Sta. Mesa zone, plus trans women riders in the same zone — a named SparkFest requirement, and our wedge. |
| "Have you validated the problem?" | Alex | Desk research so far (studies + commuter reports); first-party interviews start this week. We're honest that this is our weakest point and the thing we're closing. |

## 5. User-interview probe sheet (confirm-or-kill — the validation the rubric demands)

Target: PUP women who commute the zone after evening classes. Goal: test the riskiest assumption
(will she consult a guide vs the group chat, and will she contribute?) and validate seed pins. Ask
about **behavior, not opinions**. Judges' first evaluation question is "is the problem validated?" —
this is how we earn a real answer.

1. Walk me through your last night commute from campus — every leg, door to door.
2. Was there a stretch you felt unsafe on? Which exact spot, and what made it feel unsafe (dark? empty? a past incident)?
3. What did you *do* about it — re-route, travel with someone, pay for a ride, leave earlier/later?
4. Before you left, how did you decide your route? Did you check or ask anyone?
5. Do you ask a group chat / friends whether a route is safe tonight? Show me a recent example.
6. If an app told you "Teresa St is poorly lit and empty tonight," would you have changed anything? What?
7. Would you tap once to report a dark or empty stretch after you passed it? Why / why not?
8. Have you paid extra (Angkas/Grab) specifically to avoid an unsafe stretch? How often, how much?
9. Who do you think *should* keep this information — the school, the LGU, students?
10. If this existed and was free, what would make you open it again next week (not just once)?

> Log answers verbatim. Promote a seed pin to "validated" only when a real commuter confirms segment
> + behavior (per [evidence-register.md](../evidence-register.md)). Bring at least one real quote to
> the pitch — "a 2nd-year rider told us she..." beats any statistic in the room.
