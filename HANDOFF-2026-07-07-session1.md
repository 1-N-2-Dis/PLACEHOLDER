# Handoff — GuidHer / SparkFest (2026-07-07, session 1)

> Same discipline as the [prior handoff](./HANDOFF-2026-07-06-session2.md): this references committed
> docs instead of restating them. If a doc disagrees with this file, **the doc wins** — update or
> delete this handoff. Anti-drift is the whole point.

## Context in one line

**GuidHer** (internal codename *SaferRoute*; Firebase `demo-saferroute` — do not rename): community-
sourced, pre-trip, conditions-only safer-routing guide for women commuting the PUP Sta. Mesa zone.
Free to users, institutions pay (PUP GAD = customer #1). **SparkFest final: July 9** — 5-min pitch +
15-min Q&A. Today is 2026-07-07 — **2 days out.**

## What happened this session

Focus was **validation + outreach tooling** (Alex's lane — the highest-ROI non-demo work) plus one
product-scope ruling. Three new docs, all committed to `docs/analysis/` and registered in
[index.md](./docs/index.md) §0/§1 so the Docs Consistency Guard drift-checks them:

1. **[User Interview Guide](./docs/analysis/user-interview-guide.md)** (Alex owns) — the *how* around
   the pitch-kit §5 probe sheet. The Mom Test method (behavior not opinions; hide the product until
   the end); a **trauma-informed ethics layer** grounded in the WHO/SVRI "six golden principles" and
   trauma-informed research guidelines (this is sensitive research — women + commute safety); a
   15–20 min interview arc; which segments to validate; recruiting; a ready-to-paste **Taglish FB
   caption** (per Ate Gianne); and a researched **form-vs-comment** decision (use a 4-field Google
   Form as a private capture net + low-friction comment/DM funnel — never collect safety details in
   public comments, on privacy grounds). Later expanded in-chat with sample questions for the
   "last commute," "contribution + return," and "reveal + wrap" phases (fold into the doc if wanted —
   not yet written in).

2. **[Partnerships & Outreach](./docs/analysis/partnerships-outreach.md)** (Alex owns) — women's
   orgs/advocacies, tiered and **verification-tagged** (anti-hallucination rule: no invented
   contacts). Tier A = reachable in 2 days (PUP GAD/GFPS — **exact office/contact UNCONFIRMED, must
   verify on campus**; GDG PUP; PUP student orgs; Manila/barangay GAD). Tier B = cite, don't claim
   (UN Women Safe Cities Metro Manila; PCW/RA 11313; Plan International PH; GABRIELA — flagged as
   politically colored). Includes reach-out email/DM templates, an offer/give exchange table, and
   exact org-to-pitch-beat mapping. **Strongest find: UN Women Safe Cities MM data — street-
   harassment prevalence 88% for women 18–24 (our exact segment).** Bulletproof citation for the
   problem/Relevance beat.

3. **Forum/discussion feature — viability ruling (fable-5).** Question raised: add a forum/comment
   thread under reports or streets. **Ruling: an open free-text forum is NOT viable** — it collides
   head-on with **BR-001/BR-006/BR-007** (free text reintroduces crime labels, defamation, place-
   profiling — the idea §9 kill-criterion), is unmoderatable by a hackathon team, inverts the
   privacy principle (public identity+location+vulnerability), and is scope creep off an unstable
   core loop. The *underlying need* (women already discuss routes) is real but is better served by
   **structured corroboration** ("3 women flagged this tonight"), not open threads. In the pitch, a
   deliberate "we said no to discussion threads to protect conditions-only" is a *strength*.
   Interview questions to test the underlying need (Mom-Test framed) delivered in chat.
   **This ruling is not yet recorded in a canonical doc** — see next steps.

Also this session (housekeeping):
- **Skill renamed:** `~/.kiro/skills/executing-hard-tasks/` → `~/.kiro/skills/fable-5/` (global, name
  field updated to `fable-5`). This is the "executing hard tasks" working method.
- **Git synced:** local `main` fast-forwarded to `origin/main` (`486c841`); PR #21 already merged.
  Old branch `docs/business-analysis-and-design-system` is fully contained in main (safe to delete).

## Open threads / next steps (prioritized by score at stake)

### ⚠️ STILL OPEN — the merged crime-map artifacts (BR-001 risk, unresolved)
The `main` sync brought in a teammate's **heatmap + 99-incident CSV** work:
`backend/data/crime-reports.csv`, `backend/data/heatmap-baseline.json`,
`backend/scripts/seed-heatmap-baseline.mjs`, [HEATMAP_INTEGRATION_GUIDE.md](./docs/HEATMAP_INTEGRATION_GUIDE.md),
[updated-evidence-register.md](./docs/updated-evidence-register.md). A crime heatmap seeded from
aggregated incident counts is the precise shape **BR-001 (conditions only) / BR-007 (severity is
per-report, not a place rating)** and the [mentor-synthesis](./docs/analysis/mentor-synthesis.md) §2
"no synthetic crime data, seeds = hypotheses" guardrail exist to prevent. The guide *does* include a
BR-001 note + conditions-only note fields, so someone was thinking about it — **but it has not been
audited against BR-001/006/007 or the mentor guardrail.** This is Farhana's #1 Q&A landmine
("isn't this just a crime map?"). **Action: audit these five artifacts against the BRs before the
pitch; decide keep / reframe / walk back; log the decision in [POSTMORTEM](./docs/POSTMORTEM.md) §3.**
*(User was offered this audit and it is pending their go-ahead.)*

### Alex — validation + outreach (his lane, highest non-demo ROI)
1. **Run ≥3 (aim 5) interviews** using the [interview guide](./docs/analysis/user-interview-guide.md).
   Product hidden until the end. Bring ≥1 verbatim quote to the pitch.
2. **Post the FB caption today** (Variant A) + a GuidHer screenshot; stand up the 4-field Google Form.
3. **Send outreach today:** ask GDG PUP for the real PUP GAD contact + a post boost; wire the UN Women
   88% stat + RA 11313 into the pitch (free, do now). One honest "we've opened a conversation with
   PUP GAD" line *if the email actually goes out*.
4. **Confirm PUP's actual GAD office name/contact on campus** — do not invent it.

### Product decision to record
- If the forum "no" is accepted, log it in [POSTMORTEM](./docs/POSTMORTEM.md) §3 as a decision
  (considered → rejected, reasons: BR-001/006/007 + moderation + privacy + scope). Optionally note in
  [PRD](./docs/03-prd.md) as an explicit non-goal.

### Jim — demo (critical path, unchanged from prior handoff)
Still the score's center of gravity: fix pin-load, render first screen from static seed, verify the
2-routes-max core loop, record the video fallback, restrict the ORS key. See
[BUILD-GUIDE](./docs/BUILD-GUIDE.md) + prior handoff.

## Hard constraints (nobody overrides these)
- **Conditions only (BR-001)**; **no rescue/SOS (BR-002)**; **single zone (BR-003)**.
- **Gemini adds no facts (BR-006); severity is per-report, not a place label (BR-007).**
- Gemini key + `FIREBASE_SERVICE_ACCOUNT_KEY` + ORS key handling per
  [Security](./docs/12-security-compliance.md).
- **No fabricated facts / contacts / metrics** ([POSTMORTEM](./docs/POSTMORTEM.md) anti-hallucination
  anchor). Branch + PR, never straight to main.

## The one thing that matters most
Unchanged: **Jim's working demo + video fallback** and **Alex's real interviews**. The new docs make
Alex's half turn-key — the gap now is *doing it* (send the post, book the interview), not more
planning. And **the crime-map artifacts need a BR-001 decision before July 9**, or the "isn't this a
crime map?" question lands on unaudited ground.

## References (read, don't re-derive)
- [index.md §0](./docs/index.md) — source-of-truth map (now includes the two new analysis docs)
- [User Interview Guide](./docs/analysis/user-interview-guide.md) · [Partnerships & Outreach](./docs/analysis/partnerships-outreach.md) — new this session
- [Pitch Kit](./docs/analysis/alex-pitch-kit.md) (probe sheet §5, Q&A map §4) · [Mentor Synthesis](./docs/analysis/mentor-synthesis.md) (§2 no-synthetic-data guardrail)
- [Hackathon Context](./docs/00-hackathon-context.md) (rubric/format) · [POSTMORTEM](./docs/POSTMORTEM.md) (truth table, decision log)
- [PRD](./docs/03-prd.md) (F-###, BR-###) · [BUILD-GUIDE](./docs/BUILD-GUIDE.md) (task board)
- Crime-map artifacts under review: [HEATMAP_INTEGRATION_GUIDE.md](./docs/HEATMAP_INTEGRATION_GUIDE.md), [updated-evidence-register.md](./docs/updated-evidence-register.md)

## Session notes (drift-avoiders)
- **New docs are registered in index.md §0/§1** — so they get drift-checked going forward.
- **fable-5 skill** lives at `~/.kiro/skills/fable-5/` (global, outside this repo — not in git here).
- **Git state:** `main` = `origin/main` (`486c841`). Prior branch merged; safe to delete.
- **Unresolved:** the crime-map/BR-001 audit (above) and whether the forum "no" gets logged to
  POSTMORTEM. Both are decisions awaiting the user.
- **No redaction needed:** no secrets/PII here. Org contacts are deliberately NOT asserted — confirm
  before any outreach.
