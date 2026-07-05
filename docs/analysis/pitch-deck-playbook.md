# Pitch Deck Playbook — the VC method, re-weighted for a hackathon rubric

> **What this is:** a reusable method for building GuidHer's pitch. It takes the canonical
> venture-capital pitch-deck structure and *re-weights* it for a hackathon, because we are not
> raising money — we are being scored against a fixed rubric. The rubric, timeline, and format are
> owned by [00-hackathon-context.md](../00-hackathon-context.md); this doc does not restate the
> weights, it *uses* them. The filled-in instance (our actual narrative, BMC, script, Q&A map) lives
> in [alex-pitch-kit.md](./alex-pitch-kit.md). Working product name: **GuidHer**.

## 1. Premise — why borrow from VCs at all, and the one thing that changes

A VC pitch and a hackathon pitch do the same job: make a skeptical, time-poor evaluator believe, in
minutes, that a real problem exists and that *this* team's solution is worth betting on. The
canonical VC structure is good precisely because it sequences information in the order a skeptic
needs it. So we borrow the skeleton.

**One thing changes, and it changes everything downstream: the ask and the scorer.**

| | VC pitch | GuidHer at SparkFest |
|---|---|---|
| **Who evaluates** | An investor asking "will this return my fund?" | Judges scoring a fixed rubric ([context §5](../00-hackathon-context.md)) |
| **Implicit weighting** | Market size, business model, financials dominate | **Technology (25) + Relevance-to-theme (20) + Creativity/Uniqueness (30)** dominate |
| **The ask** | "$X for Y% equity" | "One signal of institutional commitment + what we need to pilot" |
| **Proof of feasibility** | Financial projections, traction charts | **A working demo, live** — feasibility is shown, not asserted |

So: keep the VC skeleton, but **drop the fundraising-only slides, amplify the demo, and re-point
every slide at a rubric criterion.** That translation is the whole playbook (§3).

## 2. The VC canon we're adapting (sourced)

The de-facto standard is the [Sequoia Capital deck framework](https://www.sequoiacap.com/article/writing-a-business-plan/),
a ~10-part sequence: company purpose, problem, solution, why now, market size, competition, product,
business model, team, financials ([summary](https://waveup.com/blog/how-to-supercharge-sequoia-pitch-deck-template/)).
Two supporting conventions we borrow from:

- **Y Combinator:** ~10–12 slides, one idea per slide, ruthless clarity and concision; add
  *traction* and a clear *ask* ([YC guidance](https://www.ycombinator.com/library)).
- **Guy Kawasaki's 10/20/30 rule:** 10 slides, 20 minutes, 30-point font — a discipline against
  cramming ([widely cited](https://www.inknarrates.com/post/pitch-deck-format-sequoia-yc-guy-kawasaki)).
- **Sequoia's "How to Present":** open with fast facts and *answer the obvious objections before
  they're asked*. This is the single most useful VC habit for our 15-minute Q&A.

> Content rephrased from public sources for licensing compliance; frameworks attributed inline.

## 3. The translation table (this is the playbook)

Each VC slide → its job in *our* pitch → the rubric criterion it feeds → what we do with it.
Rubric weights per [context §5](../00-hackathon-context.md): Technology 25, Relevance 20,
Creativity 15, Uniqueness 15, Feasibility 15, Presentation 10.

| VC slide | Its job for us | Feeds (rubric) | Verdict |
|----------|----------------|----------------|---------|
| **Company purpose** (1 line) | The hook — what GuidHer is in one sentence | Presentation | **Keep**, ruthless: one sentence, no jargon |
| **Problem** | The evening-commute problem, made vivid + validated | **Relevance (20)** + "problem validated?" | **Keep, lead with it.** This is where honest user-validation wins or loses points |
| **Solution + live DEMO** | Show the core loop working | **Technology (25) + Feasibility (15)** | **AMPLIFY.** The demo *is* the product slide. Feasibility is proven live, not claimed. Highest-leverage 90 seconds |
| **Why now** | RA 11313 (Safe Spaces Act) makes commute harassment a named priority | Creativity + Relevance | **Keep short** — timing + wedge in two sentences |
| **Market size** | Who benefits + the community sector | Community impact + Scalability | **Downsize + reframe.** No TAM-in-billions theater. "~41k women at PUP, single zone by design, expansion is roadmap" |
| **Competition** | Why we're different and defensible | **Uniqueness (15)** | **Keep.** Conditions-only + hyperlocal density = the moat vs generic/scraped safety maps |
| **Product** | (folded into the demo) | Technology | **Merge** into Solution+Demo |
| **Business model** | How this survives past demo day | Sustainability | **Keep, reframe:** not "how we get rich" — "free to women, institutions fund it, PUP-GAD is customer #1" |
| **Team** | Why this team can execute | (light) | **Shrink.** Judges know we're students; one credibility line, no filler |
| **Financials** | — | — | **DROP.** No projections. Replace with a one-line cost structure (near-zero infra) that supports Feasibility |
| **The ask** | What we need next | Presentation close | **Transform:** not equity — "one signal of institutional commitment + pilot support," and the one metric we're chasing |

**Net adapted arc (what actually gets presented):**
`Hook → Problem (validated) → Solution + live demo → Why now/wedge → Model + payer → Ask.`
Five beats. Everything the VC canon adds beyond this (market math, financials, cap table) is either
folded in or dropped.

## 4. The rubric-budget rule (where prep time goes)

Spend preparation time in proportion to points, not to what's comfortable to polish.

- **Technology (25) + Relevance (20) = 45% of the score, and both are Q&A-heavy.** This is where
  the 15-minute Q&A is won. Prepare the honest tech-stack defense (why non-Google maps *and* still
  Google-tech-compliant via Firebase + Gemini; Gemini's trust role) and the one-sentence theme
  mapping. See the Q&A ownership map in the pitch kit.
- **Feasibility (15)** is bought almost entirely by a **working live demo**. A demo that runs beats
  any slide. This is why the demo-reliability work (warm the backend, video fallback) is a scoring
  decision, not just engineering hygiene.
- **Creativity + Uniqueness (30)** ride on one idea told well: *conditions-only, bottom-up,
  hyperlocal* vs top-down scraped/synthetic crime maps.
- **Presentation (10)** is the smallest slice. Do not over-invest in slide transitions. A clear,
  calm 5 minutes clears it.

## 5. Delivery rules (VC habits that transfer)

1. **Answer objections before they're asked** (Sequoia). Bake the two point-costing objections into
   the pitch itself: "Isn't this just an AI crime map?" and "Is your data real?" Pre-empting them in
   the 5 minutes defuses the Q&A.
2. **One idea per slide / per breath** (YC). If a smart non-technical judge can't follow it, cut it.
3. **Big text, few words** (Kawasaki 10/20/30, adapted to a 5-minute cap). Slides support the
   speaker; they are not the script.
4. **Demo-first bias.** Show the loop working before explaining architecture. Seeing beats hearing.
5. **Route the Q&A by owner** in advance (see pitch kit §3) — 15 minutes is long enough that an
   unassigned question causes a scramble that reads as "they don't know their own project."
6. **Have the video fallback ready.** A live demo that fails on stage costs more than the Feasibility
   points it was meant to win.

## 6. How to use this playbook

1. Read the rubric ([context §5](../00-hackathon-context.md)) — that's the scoreboard.
2. Fill each beat of the §3 arc with GuidHer's real content — done in
   [alex-pitch-kit.md](./alex-pitch-kit.md) (narrative, BMC, 5-min script, Q&A map, probe sheet).
3. Budget prep time by §4. Rehearse the Q&A more than the script.
4. Before demo day, run the health check in [index.md §2](../index.md) so nothing on stage
   contradicts the repo.

## 7. Hackathon-specific anti-patterns (do not do these)

- **TAM theater** — quoting a billion-peso market for a single-zone student project. Judges score
  community impact and honest scalability, not inflated markets. Reframe to reachable community + roadmap.
- **Slide-polishing as avoidance** — Presentation is 10 points; validation and a working demo are
  where the score lives. Polishing the deck instead of running the interview probe sheet or hardening
  the demo is dodging the scary, high-value work.
- **Claiming validation you don't have.** Judges' first question is "is the problem real and
  validated?" Desk research is not validation. Say what you've actually done and what you're doing
  this week — honesty scores better than a hollow claim that collapses in Q&A.
- **Fundraising language** ("we're raising," "pre-money," "10x return"). Wrong ask for this room.
  The ask is a pilot and a signal of institutional commitment.
- **Faking depth on the AI.** If Gemini's role is overstated, one pointed Q&A question exposes it.
  Keep it to the real trust role: structure, dedupe, classify *real* reports; invents nothing.

## References
- [Hackathon Context](../00-hackathon-context.md) — rubric, timeline, format (the scoreboard)
- [Alex's pitch kit](./alex-pitch-kit.md) — the filled-in instance of this playbook
- [Mentor synthesis](./mentor-synthesis.md) — Jerico + Troy reconciled guidance
- Sequoia, Y Combinator, and Guy Kawasaki deck frameworks (linked in §2)
