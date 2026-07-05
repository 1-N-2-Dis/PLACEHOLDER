# START HERE — GuidHer team (read this first, then start)

> For teammates picking up work without Alex. Read the 6-minute path below, find your name in §3,
> and start. Everything here links to the deeper doc — this page just gets you oriented and moving.
> Last updated 2026-07-06 (before the July 9 final). Product name is **GuidHer** (the code sometimes
> says "SaferRoute" — that's the old codename, same product; see [POSTMORTEM §1](./POSTMORTEM.md)).

## 1. What we're building (30 seconds)
A community-sourced, **pre-trip** safer-routing guide for women commuting the PUP Sta. Mesa zone. It
shows which segments to avoid tonight and *why* — using **fixable conditions** (lighting, crowd,
recent condition), **never crime-zone labels**. Free to women; funded by institutions (PUP GAD first).
Single zone on purpose. We're graded at SparkFest on July 9: **5-min pitch + 15-min Q&A**.

## 2. How to navigate this repo (read in this order — ~6 min)
1. **[README.md](../README.md)** — what it is + how to install/run. (Judge-facing entry point.)
2. **[docs/index.md](./index.md) §0** — the source-of-truth map: which single doc *owns* each fact.
   When two docs disagree, the owner wins. Use this to find where anything lives.
3. **[docs/POSTMORTEM.md](./POSTMORTEM.md)** — current truth in one place: naming, every pivot, and a
   TRUE / PROVISIONAL / UNVALIDATED table. **Read this before claiming anything about the project**
   (it's also what stops an AI assistant from hallucinating).
4. **[docs/00-hackathon-context.md](./00-hackathon-context.md)** — what we're scored on (the rubric).
5. **[docs/analysis/alex-pitch-kit.md](./analysis/alex-pitch-kit.md)** — pitch, BMC, Q&A map, probe sheet.

Deeper reference when you need it: [BUILD-GUIDE.md](./BUILD-GUIDE.md) (sprint changes + DoD status),
[03-prd.md](./03-prd.md) (features F-###, rules BR-###), [06-system-design.md](./06-system-design.md)
(architecture), [12-security-compliance.md](./12-security-compliance.md) (secrets/auth),
[LOCAL_DEV.md](./LOCAL_DEV.md) + [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) (run/deploy).

**Repo layout in one glance:**
- `frontend/` — React + Vite SPA (MapLibre GL + OpenFreeMap maps, ORS routing). Deploys to Vercel.
- `backend/server/` — Express API (`submitReport`, `assessRoute`, `summarizeSegment`; holds the
  Gemini key server-side). Deploys to Render.
- `backend/` — Firestore rules, indexes, seed scripts, storage rules (Storage disabled).
- `docs/` — everything above. `AGENTS.md` (repo root) — build rules for AI agents.
- `FMD/` — doc-generation framework, **gitignored**, not part of the product. Ignore it.

## 3. Your job when you wake up (find your name, then start)

> Quick orientation below. The **authoritative, checkbox task list is the
> [BUILD-GUIDE task board](./BUILD-GUIDE.md)** — if this and that ever disagree, the task board wins.

### Jim — demo + tech stack (this is the critical path to our score)
The unchecked Definition-of-Done items are all yours (see the [BUILD-GUIDE task board](./BUILD-GUIDE.md)). In order:
1. **Fix "pins won't load."** Diagnose, don't guess — it's one of three: Render free-tier cold start,
   the Firestore deny-client-write rule gate, or the static `seed-segments` module. Confirm which.
2. **Make the first screen render from the static seed module**, not a live call to a cold-starting
   service (Troy's #1 regret was a fragile backend). Warm the backend / add a keep-alive for the demo.
3. **Record a demo video fallback** of the full core loop. Do not rely on live-only on stage.
4. **Verify the core loop end-to-end:** open map → see conditions → submit report → route adjusts,
   with **2 routes max**, the recommended (safest computed) path **and** a visible alternative, and
   the copy "recommended = safest we found."
- **Do NOT deploy the deny-client-write Firestore rule** until `submitReport` is verified against the
  emulator (it breaks report submission otherwise). **Restrict the ORS key** (origin + usage cap) —
  it's currently unrestricted. Details: [POSTMORTEM §4](./POSTMORTEM.md), [AGENTS.md](../AGENTS.md).

### Farhana — the AI/data story + technical Q&A
1. Lock the one-liner: **Gemini structures real reports** (classifies severity, dedupes, filters
   spam) and **adds no facts** (BR-006). It never scrapes or invents danger. This is the answer to
   "isn't this AI theater?"
2. Own these Q&A rows in [pitch-kit §4](./analysis/alex-pitch-kit.md): "how does the AI work,"
   "isn't this a crime map," "is the data real." Rehearse them.
3. Keep seed pins as **hypotheses**, never asserted facts. No synthetic crime data (settled — see
   [mentor-synthesis §2](./analysis/mentor-synthesis.md)).

### Helena — product + trust-first UI
1. Make sure every demo screen says **GuidHer** and is clean for recording.
2. Trust-first UI: **no emoji anywhere** (use `lucide-react` icons); no AI-purple gimmicks; no copy
   implying rescue/SOS (BR-002). Conditions-only language, never crime labels (BR-001).
3. Final wordmark/palette pass; confirm the map + condition badges read clearly on the demo device.

### Alex — business + validation (your lane; do it before/around the pitch)
1. **Run the interview probe sheet** ([pitch-kit §5](./analysis/alex-pitch-kit.md)) with real PUP
   women. This is our riskiest assumption and the judges' first question ("is the problem
   validated?"). One real quote beats any statistic on stage.
2. Rehearse the 5-min script + the 12-question Q&A ownership map; confirm each owner knows their rows.

## 4. Ground rules nobody overrides (the safeguards)
- **Conditions only** (BR-001) — never crime-zone/place labels. **No rescue/SOS** (BR-002). **Single
  zone** (BR-003). Gemini + service-account keys **server-side only**; **no secrets committed**.
- **Don't push while a teammate is mid-edit** without confirming. Work on a branch; don't force-push.
- When you change behavior, update the owning doc (see [index.md §0](./index.md)) and add a line to
  [POSTMORTEM.md](./POSTMORTEM.md) §3 so the next person isn't surprised.

## 5. If you're stuck
Check [POSTMORTEM §2](./POSTMORTEM.md) (is this TRUE or UNVALIDATED?) and [index.md §0](./index.md)
(which doc owns this?). If it's a demo bug, the [BUILD-GUIDE task board](./BUILD-GUIDE.md) (Jim's
tasks) has the diagnosis path. If it's "who decided this and why," it's in the [ADRs](./adr/) or POSTMORTEM §3.
