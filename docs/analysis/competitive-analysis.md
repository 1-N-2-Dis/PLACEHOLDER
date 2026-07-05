# Competitive analysis — ALAITAPTAP (Troy's near-twin) vs GuidHer

> Merged from the former `alaitaptap-analysis.md` (teardown) and `alaitaptap-vs-saferoute.md`
> (comparison) on 2026-07-06 to keep one single-purpose competitive doc. Source:
> [github.com/Troy-LL/ALAITAPTAP](https://github.com/Troy-LL/ALAITAPTAP) (public), read 2026-07-05,
> based on its README, `SafeRoute_PH_PRD.md`, and `SafeRoute_PH_Development_Plan.md`. Our facts trace
> to [idea.md](../idea.md), [BRD](../01-brd.md), [MRD](../02-mrd.md). Companion to
> [mentor-synthesis.md](./mentor-synthesis.md) (the reconciled takeaways from interviewing Troy).
> Nothing here is copied into our own spec docs.
>
> **Naming:** "GuidHer (ours)" = our product. Troy's project is internally named *SafeRoute* and
> branded *ALAITAPTAP*. Note the collision: two PUP teams independently landed near "SafeRoute /
> SaferRoute" — worth being aware of for branding.

## Part A — What ALAITAPTAP is

### 1. In one line
AI-flavored **walking navigation for Metro Manila that biases routes toward "safer" streets**, using
crime-incident data, street-lighting/time-of-day context, "safe spots," an ML safety score, and a
Twilio SMS "buddy alert." Built in a **4-day sprint (March 21–24, 2026)** for the **AI ASEAN Youth
Challenge 2026**. Internally *SafeRoute*; branded *ALAITAPTAP* (Filipino *alitaptap* = firefly — a
light-in-the-dark motif). Live: `alaitaptap.vercel.app`, `saferoute-asean.vercel.app`. Last commit
~4 months ago — a **finished, dormant competition entry**, not an ongoing product.

### 2. Feature set
1. **Safety-scored routes** — start/destination → 2–3 options each with a 0–100 safety score,
   green/yellow/red (fastest vs safest tradeoff shown explicitly).
2. **Danger heatmap** — crime-incident overlay; tap a red zone for a "why dangerous?" popup listing
   incident types (robbery, harassment) and dates.
3. **Safe spots** — markers for 24/7 stores, police, security posts; "nearest safe spot" + "Call 911."
4. **Buddy alert** — one-tap SMS to preset contacts with location, destination, ETA, tracking link.

### 3. Architecture & stack
| Layer | ALAITAPTAP |
|-------|-----------|
| Frontend | React 19 + Vite + React Router + **Leaflet** (OSM tiles), Tailwind + DaisyUI; **Vercel** |
| Backend | **Python / FastAPI + Uvicorn**; **Railway** |
| Data | **PostgreSQL** (Supabase/Railway), SQLAlchemy ORM |
| Routing | **OpenRouteService** (foot-walking, alternative routes) |
| "AI" | **scikit-learn Random Forest** safety scorer (pickled model) |
| Notifications | **Twilio SMS** · Geocoding: OSM Nominatim |

Clean, conventional, fast-to-ship full-stack. Sensible free-tier choices. No Google-tech dependency.

### 4. How the "AI" actually works (the crux)
The safety "AI" is **not** learned from reality. Two layers:
- **The shipped scorer** is essentially a **rule-based penalty formula**: start at 100, subtract for
  crime-incident count within a radius, time-of-day (night = higher penalty), assumed lighting,
  assumed foot traffic. Deterministic domain logic dressed as scoring.
- **The "ML model"** (Random Forest) is trained on **synthetic data the team generated**, where the
  *labels came from that same penalty formula* plus random noise. It learns to reproduce a
  hand-written rule; its "R² ≈ 0.87" measures how well it mimics the formula, **not** real danger.

To his credit, Troy's PRD flags this openly ("currently synthetic, will improve with real feedback")
and names "ML accuracy too low" as a risk with a rule-based fallback. Honest hackathon shortcut — but
as a *product*, the intelligence is currently theater.

### 5. Where the data comes from (the deepest difference)
- **Crime incidents:** scraped from news (Rappler/Inquirer/Manila Bulletin) and/or **synthetic random
  points** across a Metro Manila bounding box (the dev plan generates 500 random incidents for demo).
- **Safe spots:** partly curated (7-Eleven, police, McDonald's), partly synthetic.
- **Data flow is TOP-DOWN** — pre-seeded by the team from external/fake sources. Community/user
  reporting is explicitly "nice-to-have / post-MVP" — not built. This is the philosophical opposite
  of GuidHer, whose whole thesis is **bottom-up crowdsourcing from the women who ride the route.**

### 6. His business/GTM thinking (from the PRD roadmap)
- **Model:** freemium; corporate subscriptions (~₱500/employee/year); API licensing of safety data to
  ride-hailing; grants (Google.org, UN Women).
- **Partners:** universities (UP/Ateneo/UST), LGUs (QC/Manila), telco CSR (Globe/Smart free SMS).
- **Expansion:** QC/Manila/Makati → Cebu/Davao → ASEAN. Opex target <₱10k/month.
- A plausible slide, but a **roadmap written for judges**, not a validated plan. No real users, no
  committed payer — the same gap we have, just less openly acknowledged.

### 7. Critical assessment
**Strengths:** shipped and complete (4 working features, deployed, demoed); no cold-start at demo time
(pre-seeding); full journey in one app (plan → navigate → alert); clean engineering + unusually honest
internal docs.
**Weaknesses:** the "AI" doesn't predict real danger (reproduces a formula on synthetic data);
crime-label legal + accuracy exposure; no real users/reports/retention (dormant ~4 mo); trust problem
(assumed/synthetic safe-spot hours and incidents — a woman relying on a wrong "24/7 safe spot" is
worse off).

## Part B — ALAITAPTAP vs GuidHer

### 8. The one-sentence framing
**Troy already built the thing we're building — but made the two design choices we deliberately
rejected (crime-labels + SOS), used top-down/synthetic data instead of crowdsourcing, and went
metro-wide instead of single-zone.** He is a natural experiment in the exact fork we chose the other
side of. That's why he was worth an hour (interview reconciled in [mentor-synthesis.md](./mentor-synthesis.md)).

### 9. Side-by-side
| Dimension | ALAITAPTAP (Troy) | GuidHer (ours) |
|-----------|-------------------|----------------|
| **Status** | Shipped, submitted, dormant ~4 mo | In-build MVP for SparkFest |
| **Coverage** | Metro Manila-wide | **Single zone** (PUP Sta. Mesa) by design |
| **Data origin** | **Top-down**: scraped news + synthetic crime points | **Bottom-up**: crowdsourced reports from women riders |
| **What's mapped** | **Crime incidents** (robbery/assault/harassment) | **Fixable conditions** (poor lighting, no crowd, recent incident) |
| **"Danger" label** | Crime-zone / place labels | **Conditions only — crime-zone labels are a kill-criterion (BR-001)** |
| **Intelligence** | sklearn RF trained on **synthetic** formula labels | Gemini **structures/dedupes real reports**, adds no facts (BR-006) |
| **Rescue/SOS** | **Yes** — Buddy Alert SMS + Call 911 | **No** — rescue promise is a kill-criterion (BR-002) |
| **Trip type** | Walking navigation | Multi-modal commute (LRT + jeep + walk), pre-trip check |
| **Stack** | FastAPI/Python, PostgreSQL, Leaflet, ORS, sklearn, Twilio | Node/Express, **Firebase (Firestore/Auth) + Gemini**, MapLibre, ORS |
| **Google-tech** | None | **Firebase + Gemini** (a competition requirement for us) |
| **Cold-start** | Sidestepped via pre-seeding | **The core unsolved risk** (our riskiest assumption) |
| **Users / validation** | None (demo only) | None yet (both unvalidated) |
| **Biggest liability** | "AI" is synthetic; crime-label legal/accuracy risk | Unvalidated demand; no payer; density unproven |

### 10. Biggest value proposition of each
- **ALAITAPTAP: immediate, complete utility.** Open it anywhere in Metro Manila and it works right
  now — full plan→navigate→alert, no empty map. Breadth and completeness; it already exists and does a lot.
- **GuidHer: trust and truth in one zone.** It maps what's *real and fixable* (a woman actually
  reported this stretch is dark tonight), not what was scraped or invented. Legally defensible (no
  crime-zone profiling), honest (no rescue it can't deliver), preventive (know before you leave). Its
  strength is a **defensible, trusted, hyperlocal data asset a top-down scraper can't fake** — *if* we
  reach contribution density.

### 11. The honest tension
- Troy's model **looks more impressive today** (more features, works everywhere, "AI routing").
- Ours is **more defensible and honest**, but **only has value if real women contribute** — unproven.
- The two failure modes mirror each other: **his** is "impressive but fake/unsafe data nobody
  maintains"; **ours** is "honest and safe but empty because nobody contributes." Whoever solves their
  failure mode wins. He hasn't (dormant, synthetic). We haven't (no users). Neither has won yet.

### 12. What this means for our strategy
1. **Don't out-feature him — out-trust him.** Our wedge is legitimacy (conditions-only, real reports,
   no false rescue), not breadth.
2. **Steal his cold-start playbook, not his data model.** How he seeded a usable map is the one thing
   he solved that we haven't. Learn the method; keep our bottom-up, conditions-only data.
3. **Our "AI" must be real** where his wasn't. Gemini earns its place by structuring genuine reports
   (BR-006), or we inherit the same "AI theater" critique.
4. **Single-zone is a feature, not a limitation** against a metro-wide competitor: density and trust
   in one corridor beats a thin, synthetic map everywhere.
