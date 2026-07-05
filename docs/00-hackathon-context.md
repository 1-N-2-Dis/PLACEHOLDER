> ⚠️ PROVENANCE: Transcribed verbatim-in-substance from the official SparkFest 2026 brief
> (GDG on Campus – PUP), provided by the team on 2026-07-06. This doc is the **canonical owner**
> of the competition rules, timeline, format, and judging rubric. No facts invented; where the
> brief was ambiguous it is flagged as such. Everything else links here — do not restate rubric
> weights or the pitch format in other docs.

# SparkFest 2026 — Hackathon Context (what we're graded against)

**Why this doc exists:** the rest of the doc suite was generated from `idea.md` (product-pure) and
never ingested the competition rules. This is the scoreboard. Read it before writing the pitch,
the demo runbook, or the README — the rubric weights below decide where the last days go.

## 1. Event

- **Organizer:** Google Developer Groups on Campus – Polytechnic University of the Philippines (GDG PUP).
- **What it is:** a startup-style innovation challenge — teams build a working solution to a real
  community problem. Impact is meant to continue past demo day (winning team collaborates on a
  community outreach initiative).
- **Venue:** Bulwagang Bonifacio, PUP.
- **Dates:** June 21 – July 9, 2026.
- **Who competes:** SHS and college students, PUP and other universities.
- **Focus areas:** Technology, Innovation, Entrepreneurship, Design, AI, Community Solutions.

## 2. Challenge statement (the theme we're scored on)

> "How can we leverage technology to build smarter, safer, and more inclusive communities that
> enhance public services, strengthen infrastructure, improve accessibility, and create lasting
> social impact?"

Emphasis in the brief: **public safety, justice, strong institutions, transparency.** Our theme
line ("safer commute for women in one PUP zone, conditions-only, institution-funded") maps
directly onto *public safety* + *strong institutions* + *inclusion*. This is our home turf — but
the rubric only rewards it if we **say the mapping out loud** (see §5, Relevance = 20 pts).

## 3. Timeline (the parts that still matter)

| Date | Activity |
|------|----------|
| June 28, 2026 | Kick-off program |
| **July 2, 2026** | **First-round (elimination) submissions** — video + public GitHub repo |
| July 3 – July 6, 2026 | Workshops & mentorship sessions |
| **July 9, 2026** | **Final round — pitching & awarding** |

Today (2026-07-06) is the **last mentorship day before the final**. Elimination is behind us;
everything now points at July 9.

## 4. Two rounds, two different deliverables

### Elimination (July 2) — asynchronous
- **Video presentation** communicating problem, solution, key features.
- **Public GitHub repo** with a complete, well-documented README that explains **install, run, use**.
- Repo must reflect **real development during the event** — commit history is checked. Large dumps
  with no history can be flagged invalid.

### Final (July 9) — live
- **5-minute pitch**, then **15-minute Q&A** with judges. **5 minutes prep** before the slot.
- Teams may update the Project Brief, Proof of Concept, and code from elimination — but the
  **core idea must not change**.
- Semi-formal / formal attire.
- **This is the source of the "5-minute" pitch figure** used in
  [alex-pitch-kit.md](./analysis/alex-pitch-kit.md). The 15-minute Q&A is why the Q&A ownership
  map matters more than the script.

## 5. Judging rubric — final round (this is the scoreboard)

Weights below are the ones the final-round pitch is scored on. **Total = 100 pts.**

| Criterion | Weight | What "excellent" means | Our exposure |
|-----------|-------:|------------------------|--------------|
| **Technology** | **25** | Well-chosen, well-integrated stack; real technical depth and understanding | Highest single weight. Must defend the non-Google map stack (MapLibre + OpenFreeMap + ORS) **and** show the Google-tech requirement is met (Firebase + Gemini). Gemini's *trust role* (structure/dedupe/classify real reports, invents nothing) is the depth story. |
| **Relevance to the Theme** | **20** | Directly promotes public safety, justice, strong institutions | Say the theme mapping explicitly: public safety + inclusion + institution-funded. Do not assume judges infer it. |
| **Creativity & Innovation** | **15** | Unique approach, not common practice | The wedge: conditions-only + bottom-up crowdsourcing vs top-down scraped/synthetic crime maps. |
| **Uniqueness & Originality** | **15** | Novel approach / distinct execution | Single-zone depth + women wedge + "AI structures real reports, never manufactures danger." |
| **Feasibility** | **15** | Realistic and executable within constraints | Live working core loop + near-zero infra cost (free tiers). A working demo is worth more than slides here. |
| **Presentation & Communication** | **10** | Clear, confident, strong storytelling | Owned by the 5-min script; delivery rules already in the pitch kit. |

> Note: the brief lists a second rubric table for the **elimination (video)** round that adds
> **Submission Quality (Video Presentation) — 10 pts** on top of the same criteria. Elimination is
> already submitted; kept here only for completeness.

**What the weights tell us to do with the last 3 days:** Technology (25) + Relevance (20) =
**45% of the score**, and both are Q&A-heavy. Spend prep on (a) a crisp, honest tech-stack defense
and (b) one sentence that nails the theme — not on polishing slide transitions (Presentation is
only 10).

## 6. Hard requirements (pass/fail, not scored)

- **At least ONE Google technology.** We satisfy this with **Firebase (Auth + Firestore) + Gemini**.
  Do not let a refactor remove both — this is a disqualification risk, tracked as a health-check
  invariant in [index.md](./index.md) §2. Owned by [System Design](./06-system-design.md) / ADR-0001.
- **One community sector.** Ours: **women students (18–24) commuting the PUP Sta. Mesa zone**, plus
  trans women riders in the same zone. This is a named judging expectation, not just our framing.
- **Working prototype required.** Not concept-only — a functional output by end of hackathon.
- **Problem validation is expected.** The brief explicitly lists interviews, surveys, government
  data, academic research, community observation, public reports. Our current evidence is
  desk-research only ([evidence-register.md](./evidence-register.md)); the interview probe sheet in
  the pitch kit is how we start closing this. Judges' first evaluation criterion is literally
  "Is the problem real and validated?"
- **Public repo + README** explaining install/run/use — owned by [README.md](../README.md).
- **Original work during the event** — commit history must show it; no pre-built full projects.

## 7. Judge evaluation lens (final-round narrative, beyond the rubric table)

The brief also lists what judges look for overall. Map each to where we answer it:

| Judge asks | Where we answer it |
|------------|--------------------|
| Is the problem real and validated? | [evidence-register.md](./evidence-register.md) + interview probe sheet ([pitch kit](./analysis/alex-pitch-kit.md)) — **our weakest point; be honest about it** |
| Is the solution creative? | Conditions-only + bottom-up crowdsourcing wedge |
| Is it well-built? | Live core loop + [System Design](./06-system-design.md) |
| Is it intuitive and accessible? | The pre-trip check UX (F-003) |
| Will it improve lives? | Women changing routes / not staying home |
| Can it grow? | Roadmap only — single zone by design now (BR-003); expansion is P-later |
| Can it create lasting value? | Institution-funded model (GAD budgets/grants), community dataset moat |

## 8. Logistics that can cost points

- **Late penalty:** −1 pt per 30 min late (max −5); >2h30m late risks disqualification.
- **Attire:** semi-formal/formal for the final pitch.
- **Present for orientation + final demo** (onsite or online).

## References
- [Docs Index](./index.md) — source-of-truth map (this doc owns hackathon rules/rubric/format)
- [Alex's pitch kit](./analysis/alex-pitch-kit.md) — pitch script, BMC, Q&A map, interview probe sheet
- [Idea brief](./idea.md) · [PRD](./03-prd.md) · [System Design](./06-system-design.md)
- [Evidence Register](./evidence-register.md) — current (desk-only) validation state
