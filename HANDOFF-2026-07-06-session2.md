# Handoff — GuidHer / SparkFest (2026-07-06, Session 2)

> References committed docs instead of repeating them — those are current and won't drift. For the
> repo's own docs, read those; this handoff just connects the dots.

## Context in one line
**GuidHer** (internal codename *SaferRoute*; Firebase project `demo-saferroute` — do not rename):
community-sourced, pre-trip, conditions-only safer-routing guide for women commuting the PUP Sta.
Mesa zone. Free to users, institutions pay (PUP GAD = customer #1). SparkFest final: **July 9,
5-min pitch + 15-min Q&A**. Repo: `1-N-2-Dis/GuidHer` (was placeholder, now real).

## What happened this session (all in PR #21, merged or pending)

### 1. Business analysis review — honest verdict delivered
User asked: "is our business side of things already enough?" Answer: **yes, over-built if anything**.
You have ~10 business docs for a single-zone student MVP with zero first-party validation. The
business *thinking* is strong — BMC, pitch playbook (VC method → hackathon rubric), mentor
synthesis, competitive analysis — all good. The gap was never more frameworks; it's *evidence* (real
user interviews, one GAD conversation) and a working demo.

**Concrete strategic guidance given (ranked by rubric leverage):**
1. **Validation interviews** (highest ROI) — feeds Relevance (20 pts) + judges' first question "is
   it validated?" Alex is already on this; probe sheet exists in [pitch kit
   §5](docs/analysis/alex-pitch-kit.md).
2. **Working demo + video fallback** (Jim's lane) — feeds Technology (25) + Feasibility (15). Core
   path to score.
3. **GAD budget number + one-paragraph pilot ask + outreach email** — cheap, together they
   bulletproof the sustainability Q&A. Research method provided (see §4 below).
4. **Skip for now:** closing an actual institutional commitment (nice-to-have, not scoreable),
   theory-of-change/M&E logframe (over-recommended in session 1 — it's genuinely necessary *later*
   for the real grant conversation, but building it now is avoidance), any new business framework.

**Interview question answered (show/hide the product during validation):**
- **Hide it until the end** — probe sheet is behavior-based (correct instrument). If you open with
  the app, you contaminate the signal ("oh nice, yeah I'd use this" = fake positive). Ask about
  *actual* behavior today first. Then show the app at the end and watch the reaction.
- **Show it for FB recruiting / traction** — screenshots/clips to attract leads is marketing, not
  validation. The one signal that matters: does anyone who sees the post *do* something (sign up,
  submit a report, return next week). Watch behavior, discount words.
- **Caution:** if the demo is fragile ("pins won't load"), post a screenshot or video, not a live
  link that breaks. A broken first impression burns trust you can't rebuy.

### 2. Fixed the F-005 "2–3 routes" → "2 routes max" drift
Caught real inconsistency: the locked decision (mentor-synthesis §4, BUILD-GUIDE, POSTMORTEM) is **2
routes max (safest + 1 alternative)**, but the canonical owner docs (`03-prd.md` feature table,
UJ-004, acceptance; `11-qa-test-plan.md` scope, TC-018, acceptance) still said "2–3" or "1–3."
Fixed: both owner docs now read **2 routes max**. Logged in POSTMORTEM §3.

### 3. Made the business analysis + pitch material discoverable
The BMC, pitch-deck playbook, mentor-synthesis, and competitive-analysis existed but were invisible
in index.md §0 (the source-of-truth map), so they'd never get drift-checked. Fixed: index.md §0 now
lists:
- Pitch Kit (Alex owns; BMC lives in §2)
- Pitch Deck Playbook (method)
- Mentor Synthesis (Jerico + Troy reconciled)
- Competitive Analysis (ALAITAPTAP)
- **Design System** (new, see below)

All with explicit owners. §1 has rows for them. Because they're in §0 now, the Docs Consistency
Guard hook will drift-check them going forward.

### 4. Created the Design System doc (Helena-owned, grounded in real code)
Added `docs/design-system.md` — the canonical home for GuidHer's visual/brand system, design tokens,
UI components, and UI voice. **Grounded in the actual build** (transcribed from
`frontend/src/styles.css` `:root` tokens, `frontend/index.html` fonts,
`frontend/src/data/{condition-types,severity-types}.js`) so it's not invented aspirational design,
it's the current reality. Helena owns; designed to be iterated on freely with Ate Ayen / Kuya Troy
and the `design-taste-frontend` skill (`.agents/skills/`).

**Two critical callouts in the doc that override generic design-skill defaults:**
- **`lucide-react` is the project standard** (mandated in AGENTS.md), not discouraged.
- **Purple *is* the GuidHer brand** (`#4B2E83` + pink + gold + cream) — it's an intentional,
  harmonised palette, not a thoughtless AI-purple reach. The rule bans *thoughtless* purple glow; it
  does not ban a purple brand executed with intent.

The doc includes: brand, color tokens (light + dark), typography, shape/elevation/spacing, core
components (buttons/cards/forms/badges/nav/map surfaces), iconography, UI voice/copy rules (BR-001
conditions-only, BR-002 no rescue), a11y baseline, deck-app alignment, and a **feedback capture
table** for Ate Ayen / Kuya Troy (currently blank — Helena fills it after the calls). Change log
seeded.

Why it matters: Presentation is only 10 rubric points, but the pitch deck and the app must look like
the same product. Design System gives Helena + the deck-builder a single canonical source so they
never drift apart.

### 5. Git remote fixed + PR opened
The remote was a literal placeholder (`https://github.com/Alexandre-Nevero/PLACEHOLDER.git`). Fixed:
`origin` now points to the real repo (`https://github.com/1-N-2-Dis/GuidHer.git`). Installed `gh`
CLI (`brew install gh`), authenticated as `Alexandre-Nevero`, pushed branch
`docs/business-analysis-and-design-system`, opened **PR #21**:
https://github.com/1-N-2-Dis/GuidHer/pull/21.

## What's next (open threads, prioritized by score at stake)

Per [BUILD-GUIDE.md](docs/BUILD-GUIDE.md) task board (the authoritative "who does what now"):

### Jim — demo + engineering (critical path, all unverified)
1. **Diagnose + fix "pins won't load"** — Render cold start / Firestore deny-write rule / static
   seed module. Diagnose, don't guess.
2. **First screen renders from static seed module** + warm backend / add keep-alive for demo.
3. **Verify core loop end-to-end** — 2 routes max, safest + visible alternative, "safest we found" copy.
4. **Record demo video fallback** — do not rely on live-only on stage.
5. **Restrict ORS key** (origin + usage cap) — currently unrestricted.
6. `[guardrail]` Do NOT deploy the deny-client-write Firestore rule until `submitReport` is verified
   against the emulator (breaks submission otherwise).

### Alex — business + validation (highest ROI outside of the demo itself)
1. **Run the interview probe sheet** ([pitch kit §5](docs/analysis/alex-pitch-kit.md)) with ≥3 real
   PUP women. This is the riskiest assumption *and* the judges' first question ("is the problem
   validated?"). Bring ≥1 real quote to the pitch.
2. **GAD budget number research** (optional but cheap, high Q&A leverage) — see §4 below.
3. **PUP GAD outreach email** (optional but cheap) — not to close a deal, but to get one sentence:
   "we've already opened a conversation with PUP's GAD office." That reads as traction. Expect no
   signature; use whatever warmth you get as a Q&A asset.
4. Rehearse the 5-min script + confirm every Q&A owner knows their rows ([pitch kit
   §3–§4](docs/analysis/alex-pitch-kit.md)).

### Farhana — AI/data + technical Q&A
1. Lock the one-liner: **Gemini structures real reports** (severity, dedupe, spam filter) and **adds
   no facts** (BR-006). This is the answer to "isn't this AI theater?"
2. Own and rehearse the AI Q&A rows: "how does the AI work," "isn't this a crime map," "is the data
   real" ([pitch kit §4](docs/analysis/alex-pitch-kit.md)).
3. `[guardrail]` Seeds stay Tier-B hypotheses; no synthetic crime data ([mentor-synthesis
   §2](docs/analysis/mentor-synthesis.md)).

### Helena — product/UI + outreach
1. **Reach out to Ate Ayen and Kuya Troy** for UI/UX and branding improvements; capture their input
   in the feedback table ([design-system.md §11](docs/design-system.md)) and fold actionable changes
   into the demo screens. Record who suggested what in [POSTMORTEM §3](docs/POSTMORTEM.md).
2. Every demo screen shows **GuidHer** and is clean for recording.
3. Final wordmark/palette pass.
4. `[guardrail]` Trust-first UI: no emoji (use `lucide-react` icons), no AI-purple gimmicks, no
   rescue/SOS copy, conditions-only language (BR-001/BR-002).

## §4. GAD budget research method (for Alex, if pursuing)

**Why it's worth an afternoon:** converts the weakest business claim — "institutions will pay,"
currently an admitted ₱10M–₱100M guess — into one un-pokeable sentence in Q&A: "PUP has a
legally-mandated GAD budget of roughly ₱X a year; funding a student-safety tool is squarely inside
its existing mandate." That's the difference between a hopeful answer and a factual one.

**How, concretely:**
1. **Confirm the legal floor.** The [Magna Carta of Women (RA
   9710)](https://www.csc.gov.ph/programs/magna-carta-of-women-ra9710) and the PCW/DBM/NEDA joint
   GAD budget guidance require **at least 5% of an agency's total budget** go to Gender and
   Development ([confirmed across GAD
   guidance](https://sites.google.com/view/dcwdgad/resources/gad-plan-and-budget)). PUP is a state
   university, so it's covered. (Content rephrased from public sources for licensing compliance.)
2. **Get PUP's actual budget from the General Appropriations Act** — PUP is a line item in the SUCs
   section of the annual GAA (public, on the DBM site). 5% of that is the order-of-magnitude GAD
   envelope.
3. **Better still, find PUP's published GAD Plan and Budget (GPB)** or GAD Accomplishment Report if
   it's online — many agencies post them. That gives you the real number and what they already spend
   it on.
4. **Record it in the evidence register** with the source, tagged `[verified]` from the GAA — **do
   not invent a peso figure.**

**One-paragraph pilot ask (for the pitch "ask" beat + Q&A):**

> "We're proposing a 6-week pilot with one PUP GAD cohort — 20–30 women students commuting the Sta.
> Mesa zone after evening classes. We need: cohort recruitment support from the GAD office, one
> orientation session to onboard them, and permission to share anonymized usage data back to the
> office. PUP gets: behavioral proof (how many changed routes, how many contributed reports), a
> dataset the GAD office owns, and a case study for their next GAD accomplishment report. It costs
> PUP near-zero — we run it on free infrastructure. After 6 weeks, if it works, we scale it; if it
> doesn't, we learned together."

Use this in the pitch closing beat and the "what's the smallest yes?" Q&A answer. Concrete > vague.

## Hard constraints (nobody overrides these)

- **Conditions only (BR-001)** — never crime-zone/place labels.
- **No rescue/SOS (BR-002)**.
- **Single zone (BR-003)**.
- **Gemini key + FIREBASE_SERVICE_ACCOUNT_KEY server-side only**; no secrets committed.
- **Branch + PR, never straight to main**; don't push while a teammate is mid-edit without confirming.

## The one thing that matters most

Docs/pitch/business are done. The score now rides on **Jim's working demo + video fallback** and
**Alex's real user interviews** — the unchecked items a judge actually scores (Technology +
Feasibility + "is it validated?").

## References (read these, don't re-derive)

All committed to `1-N-2-Dis/GuidHer`, current as of PR #21:
- [START-HERE.md](docs/START-HERE.md) — human entry point: repo navigation + per-person next actions.
- [index.md §0](docs/index.md) — source-of-truth map (which doc owns which fact).
- [POSTMORTEM.md](docs/POSTMORTEM.md) — change/decision log, naming truth, TRUE/PROVISIONAL/UNVALIDATED table.
- [00-hackathon-context.md](docs/00-hackathon-context.md) — SparkFest judging rubric + format (the scoreboard).
- [BUILD-GUIDE.md](docs/BUILD-GUIDE.md) — per-owner task board (authoritative "who does what now").
- [alex-pitch-kit.md](docs/analysis/alex-pitch-kit.md) — narrative, BMC, 5-min script, 12-Q Q&A map, probe sheet.
- [pitch-deck-playbook.md](docs/analysis/pitch-deck-playbook.md) — VC method → rubric.
- [mentor-synthesis.md](docs/analysis/mentor-synthesis.md) — Jerico + Troy reconciled.
- [competitive-analysis.md](docs/analysis/competitive-analysis.md) — ALAITAPTAP teardown.
- [design-system.md](docs/design-system.md) — brand, tokens, components, UI voice (Helena-owned).
- [PRD](docs/03-prd.md) (F-###, BR-###), [System Design](docs/06-system-design.md) (architecture),
  [QA](docs/11-qa-test-plan.md) (traceability), [Security](docs/12-security-compliance.md) (auth/secrets).

## Session-specific notes (drift-avoiders)

**Why this handoff references docs instead of repeating them:** the previous handoff restated facts
that then drifted (e.g., "origin repointed to 1-N-2-Dis/GuidHer" — wasn't true in the clone). This
one links to the canonical source for every claim. If a doc says something different than this
handoff, the doc wins — update or delete this file.

**Installed this session:** `gh` CLI (Homebrew, authenticated as `Alexandre-Nevero`). If `gh`
commands fail in future sessions, re-auth: `gh auth login`.

**Git state now:** `origin` = `https://github.com/1-N-2-Dis/GuidHer.git` (real, no longer
placeholder). Current branch in the working tree: `docs/business-analysis-and-design-system` (PR
#21). To return to main: `git checkout main && git pull origin main`.

**No redaction needed:** no API keys, tokens, or PII in this handoff or PR #21. Secrets referenced
by name only (Gemini key, FIREBASE_SERVICE_ACCOUNT_KEY, ORS key) — all server-side, never in the repo.
