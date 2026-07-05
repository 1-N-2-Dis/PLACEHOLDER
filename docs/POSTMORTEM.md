# GuidHer — Change & Decision Log (Post-Mortem / Anti-Hallucination Anchor)

> **Purpose.** One append-only place that records every real change, pivot, and naming decision on
> this project, so a human or an AI can get the *current truth* without re-deriving it from 80+
> scattered markdown files. **If another doc disagrees with this log, this log wins until the other
> doc is reconciled** (same rule as [index.md](./index.md) §0, extended to history).
>
> **How to use this as AI context.** Read §1 (names), §2 (what is TRUE vs PROVISIONAL vs
> UNVALIDATED), and §3 (pivots) before making any claim about the project. Do not state anything in
> the UNVALIDATED column as fact. Do not invent metrics, payers, incidents, or crime data.
>
> **Maintained:** append entries at the top of §3 with a date. Do not rewrite history; supersede it.
> Last updated: 2026-07-06.

## 1. Naming — the single most confused fact (read first)

**There is one product with two names. They are the same thing.**

| Name | Where it appears | Status |
|------|------------------|--------|
| **GuidHer** | README title/tagline, live demo `guidher.vercel.app`, repo `1-N-2-Dis/GuidHer`, `frontend/GuidHer_Assets/`, all pitch/business material | **Public product name — use this in anything a judge sees.** |
| **SaferRoute** / "SaferRoute Sta. Mesa" | Internal FMD docs (AGENTS.md, most `docs/*`), code comments, `console.info('[SaferRoute] …')` | **Original internal codename.** Still in the codebase and doc provenance banners. Not a different product. |
| **`demo-saferroute`** | Firebase project id (README, LOCAL_DEV, DEPLOYMENT_GUIDE, `.env` examples) | **Technical identifier — do NOT rename.** Renaming breaks local/emulator config. |

**Rule going forward:** judge-facing surfaces say **GuidHer**. Internal code/docs may still say
SaferRoute; that is a known, tracked migration (see §4 open items), **not** a contradiction to
"fix" blindly — the code and the Firebase project still use SaferRoute/`demo-saferroute`.

## 2. Current truth table (TRUE / PROVISIONAL / UNVALIDATED)

| TRUE (shipped / decided) | PROVISIONAL (decided, not yet verified end-to-end) | UNVALIDATED (do not state as fact) |
|---|---|---|
| Map stack = MapLibre GL + OpenFreeMap (keyless, non-Google) | Demo core loop runs live (pin-load bug seen — cause not confirmed) | That women will use the app instead of the group chat |
| Routing = OpenRouteService (ORS); client key **unrestricted (open risk)** | Firestore deny-client-write rule (F-006) — verify vs emulator before deploy | That women will contribute reports at useful density |
| Reports written server-side via Express on Render (`submitReport`) | Backend warm/keep-alive for demo | Any institutional payer commitment (PUP GAD not yet engaged) |
| Gemini = trust role only (classify severity, dedupe, spam filter); adds no facts | Demo video fallback recorded | The ₱10M–₱100M institutional band (order-of-magnitude reasoning, unproven) |
| Google-tech requirement met by **Firebase (Auth+Firestore) + Gemini** | Name migration to GuidHer in code/internal docs | The seed map pins (Teresa St, Pureza, etc. — all "confirm-or-kill" hypotheses) |
| Conditions-only, never crime-zone labels (BR-001); no rescue/SOS (BR-002); single zone (BR-003) | | Any crime statistic for the zone (we do not collect or assert these) |
| Firebase Storage / photo evidence (F-007) **disabled** (ADR-0002) | | |
| Hosting: frontend on Vercel, compute on Render, Firestore+Auth on Firebase | | |
| Problem evidence = **desk research only** (studies + commuter reports); no first-party interviews yet | | |

## 3. Pivots & decisions (newest first)

### 2026-07-06 — Hackathon context captured; pitch built on a VC-deck method; README de-landmined
- Added [00-hackathon-context.md](./00-hackathon-context.md) as canonical owner of the SparkFest
  rules, timeline, and **judging rubric** (Technology 25, Relevance 20, Creativity 15, Uniqueness 15,
  Feasibility 15, Presentation 10; final round = 5-min pitch + 15-min Q&A). Root cause it fixed: the
  doc suite was generated from `idea.md` (product-only) and never ingested the competition rules —
  which is why the pitch "5 minutes" figure was previously unsourced.
- Added [pitch-deck-playbook.md](./analysis/pitch-deck-playbook.md): the Sequoia/YC/Kawasaki deck
  canon **re-weighted for the rubric** (drop financials, amplify the live demo, turn "the ask" into a
  pilot + a signal of commitment).
- Rewrote [alex-pitch-kit.md](./analysis/alex-pitch-kit.md) under the **GuidHer** name: narrative,
  BMC (each block mapped to a pitch beat), 5-min script (each beat mapped to the rubric), 12-question
  Q&A ownership map, interview probe sheet.
- Fixed `README.md`: removed a bogus "Tier 3 — Live Google Maps" setup step + `VITE_MAPS_API_KEY`
  (Google Maps is used nowhere in code and it contradicted the non-Google stack); marked Firebase
  Storage disabled. This protects the Technology score from a README-vs-pitch contradiction.
- Confirmed `backend/functions/` is **already deleted** (was the old Cloud Functions code superseded
  by `backend/server/`).

### 2026-07-02 — Hosting/compute split (ADR-0002)
- Frontend Firebase Hosting → **Vercel**. `submitReport`/`assessRoute`/`summarizeSegment` moved from
  Firebase Cloud Functions → **`backend/server` (Express) on Render**. **Firebase Storage disabled**
  (Spark plan can no longer provision a bucket) → F-007 photo evidence unwired. Firestore + Auth
  unchanged (this is what now satisfies the Google-tech requirement). New secret:
  `FIREBASE_SERVICE_ACCOUNT_KEY` (server-side only).

### ~2026-07-01 — Two mentoring sessions reconciled ([mentor-synthesis.md](./analysis/mentor-synthesis.md))
- **Jerico's ML web-scraping idea → REJECTED.** Troy (who shipped the near-twin, ALAITAPTAP) said a
  hyperlocal project doesn't need synthetic crime data and that it "overloads the scorecard."
  Reintroducing scraped crime data would revive the BR-001 defamation/profiling risk and kill the
  trust moat. Kept instead: scraping for **cold-start seeds only, framed as hypotheses**; Gemini in
  the trust role.
- **Routing (F-005): 2–3 routes → cap at 2** (Troy). Recommend the safest computed path; always show
  the alternative even if worse.
- **Business model locked:** free to users; institutions pay; **PUP GAD office = customer #1**; goal
  = one signal of institutional commitment.
- **Scope locked:** single zone (PUP Sta. Mesa) + women wedge for the pitch; expansion is roadmap
  only.
- Demo-reliability rule: the first screen must render from the static seed module, not wait on a
  cold-starting service (Troy's biggest regret was a fragile microservice backend).

### ~2026-07-01 — Features added during build
- F-005 (multi-route), F-006 (AI report classification/moderation, server-side), F-007 (photo
  evidence — later disabled), F-008 (AI "is my route safe tonight?" for the recommended route).

### ~2026-06-30 — Map stack decision (ADR-0001)
- Original system-design assumed Google Maps Platform → switched to **MapLibre GL + OpenFreeMap
  (keyless) + OpenRouteService**. Google Maps needs billing + a restricted key for a 2-day build, and
  the Google-tech requirement is already met by Firebase + Gemini.

### Origin
- Product: a community-sourced, pre-trip safer-routing guide for women commuting the PUP Sta. Mesa
  zone. Conditions-only. See [idea.md](./idea.md) for the problem brief and the F-### spine.

## 4. Open items / risks (do not lose these)
- **Demo reliability** — "pins won't load"; likely Render cold start, possibly the Firestore
  deny-write gate or the static segments module. Diagnose, don't guess. Video fallback required.
- **Do NOT deploy the deny-client-write Firestore rule** until `submitReport` is verified vs the
  emulator (breaks submission otherwise).
- **ORS key is unrestricted** — restrict by origin + usage cap before any public demo.
- **Validation gap** — riskiest assumption (use vs group chat; will they contribute) is unproven.
  Interview probe sheet ([pitch kit §5](./analysis/alex-pitch-kit.md)) is how we test it. Judges'
  first question is "is the problem validated?"
- **Name migration** — GuidHer public; SaferRoute/`demo-saferroute` still in code + internal docs.
  Tracked, not urgent; do not rename the Firebase project id.
- **Doc bloat** — largely addressed 2026-07-06: analysis docs merged 6→4; `HANDOFF.md` deleted
  (superseded by this file). `FMD/` (46 files) is a framework, kept but **gitignored** so it never
  ships. Remaining: ~19 "SaferRoute" codename mentions in code/secondary docs (tracked, low priority).

## References
- [Docs Index](./index.md) — source-of-truth map · [Hackathon Context](./00-hackathon-context.md) —
  rubric · [Build Guide](./BUILD-GUIDE.md) — sprint changes · [Mentor Synthesis](./analysis/mentor-synthesis.md)
- Decisions: [ADR-0001](./adr/ADR-0001-maps-stack.md), [ADR-0002](./adr/ADR-0002-hosting-compute-split.md)
