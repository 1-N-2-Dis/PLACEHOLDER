# Build Guide — remaining sprint work (GuidHer · SparkFest final, July 9)

> **This doc = what's LEFT to do, grouped by owner.** Finished work and pivots have been moved to
> the change log so this stays clean. Read order for anyone jumping in:
> [START-HERE](./START-HERE.md) → this board → [POSTMORTEM](./POSTMORTEM.md) (history/why) →
> [pitch kit](./analysis/alex-pitch-kit.md). The rubric we're scored on:
> [00-hackathon-context](./00-hackathon-context.md). The mentor "why": [mentor-synthesis](./analysis/mentor-synthesis.md).

## Locked decisions (do not reopen mid-sprint)
1. **Name:** GuidHer everywhere judge-facing (SaferRoute = internal codename; see POSTMORTEM §1).
2. **Scope:** single zone (PUP Sta. Mesa) + women wedge. Expansion is a roadmap slide only.
3. **Data:** conditions-only, never crime-zone labels (BR-001). Seeds = hypotheses. Gemini structures real reports, never manufactures danger (BR-006).
4. **Business language:** free to users; institutions pay; PUP-GAD = customer #1.
5. **Feature freeze:** anything not working by demo day is cut. No new features now.

---

## Task board — by owner

Each box is a remaining task. `(opt)` = optional/roadmap, cut-safe. `[guardrail]` = a rule, not a task.

### Alex — business + validation
- [ ] **Run the interview probe sheet with real PUP women** ([pitch kit §5](./analysis/alex-pitch-kit.md)). This is the riskiest assumption *and* the judges' first question ("is the problem validated?"). Bring ≥1 real quote to the pitch.
- [ ] Rehearse the 5-min script + confirm every Q&A owner knows their rows ([pitch kit §3–§4](./analysis/alex-pitch-kit.md)).
- [ ] Housekeeping: resolve the git remote (currently a placeholder) and push the doc work.
- Done → BMC, narrative, pitch script, Q&A map, probe sheet, playbook (see [pitch kit](./analysis/alex-pitch-kit.md)).

### Jim — demo + engineering (the critical path to our score)

- [ ] Make the **first screen render from the static seed module**, not a live call to a cold-starting service. Warm the backend / add a keep-alive for demo day.
- [x] Verify the **core loop end-to-end**: open map → conditions → submit report → route adjusts, with **2 routes max**, recommended (safest computed) path **+ visible alternative**, and "recommended = safest we found" copy (F-005). Done via the client-side WASM routing engine (ADR-0003) — verified in-browser 2026-07-06, see [POSTMORTEM §3](./POSTMORTEM.md).
- [x] Confirm the **PRD F-005 line reads "2 routes"** (was 2–3); if you change it, add a line to [POSTMORTEM §3](./POSTMORTEM.md). Done as part of ADR-0003.
- [ ] **Record a demo video fallback** — do not rely on live-only on stage.
- [x] ~~Restrict the ORS key (origin/referrer + usage cap) — currently unrestricted.~~ **Obsolete (ADR-0003):** ORS is removed entirely — routing runs client-side (Rust/WASM), there is no routing key to restrict anymore.
- [ ] `(opt)` Google One Tap sign-up (Firebase Auth Google sign-in already exists — low effort).
- [ ] `[guardrail]` Do **not** deploy the deny-client-write Firestore rule until `submitReport` is verified against the emulator (breaks submission otherwise).

### Farhana — AI/data + technical Q&A
- [ ] **Diagnose + fix "pins won't load."** Confirm which of three it is — Render free-tier cold start / Firestore deny-client-write rule gate / static `seed-segments` module. Diagnose, don't guess.
- [ ] Lock the one-liner: **Gemini structures real reports** (severity, dedupe, spam filter) and **adds no facts** (BR-006). This is the answer to "isn't this AI theater?"
- [ ] Own and rehearse the AI Q&A rows: "how does the AI work," "isn't this a crime map," "is the data real" ([pitch kit §4](./analysis/alex-pitch-kit.md)).
- [ ] `[guardrail]` Seeds stay Tier-B hypotheses; no synthetic crime data ([mentor-synthesis §2](./analysis/mentor-synthesis.md)).
- [ ] `(opt)` Positive-signal enrichment (verified safe-space POIs, time-of-day awareness, crowd) — Troy's idea; only if demo-safe, else roadmap.

### Helena — product/UI + outreach
- [ ] **Reach out to Ate Ayen and Kuya Troy** for UI/UX and branding improvements; capture their input and fold actionable changes into the demo screens (and record who suggested what in [POSTMORTEM §3](./POSTMORTEM.md)).
- [ ] Every demo screen shows **GuidHer** and is clean for recording.
- [ ] Final wordmark/palette pass.
- [ ] `[guardrail]` Trust-first UI: no emoji (use `lucide-react` icons), no AI-purple, no rescue/SOS copy, conditions-only language (BR-001/BR-002).

---

## Definition of Done (sprint gate) — status 2026-07-06
- [ ] **(Jim)** Core loop works, live + on video.
- [x] **(Jim)** 2-route recommendation with visible alternative + "safest we found" copy. (ADR-0003, client-side WASM engine.)
- [ ] **(Jim/Farhana)** No crime-zone labels; conditions-only verified end-to-end.
- [ ] **(Jim)** Backend warmed / demo video recorded as fallback.
- [x] Name + stack consistent across key docs; decision log seeded → [POSTMORTEM](./POSTMORTEM.md).
- [x] BMC + pitch script + Q&A map + probe sheet ready → [pitch kit](./analysis/alex-pitch-kit.md).

> Open boxes are all demo/engineering (Jim's lane) — they need the app run/recorded, which is what a
> judge actually scores under Technology + Feasibility. Docs/business items are done.

## Where the finished work + rationale live
- **What changed and why** → [POSTMORTEM.md](./POSTMORTEM.md) (pivots, naming, TRUE/UNVALIDATED table).
- **Mentor advice reconciled** → [mentor-synthesis.md](./analysis/mentor-synthesis.md).
- **De-bloat status** → done: analysis docs merged 6→4, HANDOFF deleted, FMD kept but gitignored.
