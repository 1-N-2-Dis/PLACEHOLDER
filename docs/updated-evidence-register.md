# Updated Evidence Register — Data Analysis from crime-reports-MERGED.csv

> **What this is.** A data-driven analysis of 99 collected incident reports across
> 21 locations in the LRT-2 commute corridor. Built on top of the original
> `evidence-register.md` framework (Tier A/B/C). All counts and rankings come
> directly from `crime-reports-MERGED.csv`.
>
> **How to read severity scores.** Each location gets a composite score based on:
> report volume (raw count), incident severity weight (Robbery/Physical Assault = 3,
> Theft/Snatching/Groping = 2, Poor Lighting/Harassment/Scam = 1), and source
> quality (first-party interview/news = confirmed; evidence-register Tier B = unverified).
>
> **Verification status tags used here:**
> - ✅ **CONFIRMED** — First-party interview, direct eyewitness, or published news
> - ⚠️ **MULTI-SOURCE** — Multiple independent community posts corroborate the pattern
> - 🔶 **UNVERIFIED** — Single source or evidence-register Tier B only
> - 🔴 **PRIORITY** — High severity + unverified = most urgent to confirm with real users

---

## 0. Overall Dataset Summary

| Metric | Value |
|---|---|
| Total reports | 99 |
| Unique locations | 21 |
| Date range | 2012 – 2026-05 (post-2021: 92 reports) |
| Confirmed (first-party / news) | ~38 reports |
| Community-corroborated (Reddit/Facebook multi-source) | ~41 reports |
| Unverified (Tier B evidence-register only) | ~20 reports |

**Incident type breakdown across all locations:**

| Type | Count | % |
|---|---|---|
| Theft (pickpocket, bag-slash, distraction) | 28 | 28% |
| Poor Lighting / Unsafe Area | 20 | 20% |
| Snatching (grab-and-run, motor snatch) | 14 | 14% |
| Other (advisories, workarounds) | 8 | 8% |
| Groping / Harassment | 7 | 7% |
| Robbery (armed, weapon threat) | 7 | 7% |
| Overcharging / Scam | 6 | 6% |
| Catcalling | 3 | 3% |
| Verbal Harassment | 2 | 2% |
| Physical Assault | 2 | 2% |
| Unsafe Infrastructure | 2 | 2% |

---

## 1. Location Severity Rankings

Locations ranked by composite severity. Use this to prioritize which segments
to validate first with real users.

| Rank | Location | Reports | Top Incident Type | Severity | Verify Priority |
|------|----------|---------|-------------------|----------|-----------------|
| 1 | **LRT-2 Pureza Station** | 16 | Theft / Poor Lighting | 🔴 CRITICAL | P1 — highest report volume, mixed confirmed/unverified |
| 2 | **Magsaysay Boulevard** | 11 | Snatching / Poor Lighting | 🔴 HIGH | P1 — confirmed armed holdap, motor snatchers |
| 3 | **Recto Avenue** | 9 | Theft | 🔴 HIGH | P1 — all community-corroborated, broad daylight |
| 4 | **Teresa Street** | 9 | Snatching / Poor Lighting | 🔴 HIGH | P1 — in GuidHer's core zone, Tier B needs confirmation |
| 5 | **LRT-2 Legarda Station** | 7 | Theft / Poor Lighting | ⚠️ HIGH | P1 — confirmed pickpocket pursuit, dark exits |
| 6 | **España Boulevard** | 7 | Poor Lighting / Theft | ⚠️ HIGH | P2 — strong lighting + theft pattern, outside core zone |
| 7 | **Lacson Avenue** | 6 | Snatching / Poor Lighting | ⚠️ MEDIUM-HIGH | P2 — confirmed motor snatch, known holdap hotspot |
| 8 | **Pureza Street** | 6 | Poor Lighting / Theft | ⚠️ MEDIUM | P1 — directly adjacent to Pureza Station, same foot traffic |
| 9 | **Recto Legarda** | 5 | Robbery / Poor Lighting | 🔴 HIGH | P1 — armed incidents confirmed, 3-5AM unsafe window |
| 10 | **Morayta Street** | 5 | Theft / Robbery | ⚠️ MEDIUM-HIGH | P2 — armed balisong robbery confirmed, pickpocket endemic |
| 11 | **LRT-2 Araneta-Cubao Station** | 4 | Snatching / Groping | ⚠️ MEDIUM | P3 — outside core zone, confirmed snatch on train |
| 12 | **P. Campa** | 2 | Other (avoidance route) | 🔶 LOW | P3 — advisory only, no direct incidents |
| 13 | **Stop & Shop** | 2 | Poor Lighting / Other | ✅ LOW | P2 — in core zone, confirmed dark back area |
| 14 | **V. Mapa** | 2 | Theft / Poor Lighting | ⚠️ MEDIUM | P2 — crowd-squeeze syndicate confirmed |
| 15 | **Anonas Street** | 2 | Theft / Catcalling | ✅ LOW-MEDIUM | P2 — in core zone, pickpocket advisory confirmed |
| 16 | **LRT-2 Gilmore Station** | 1 | Scam | 🔶 LOW | P3 — single report |
| 17 | **LRT-2 Recto Station** | 1 | Theft | ⚠️ LOW-MEDIUM | P2 — confirmed modus near Isetann exit |
| 18 | **Sampaloc** | 1 | Snatching | ✅ LOW | P3 — single news-confirmed incident |
| 19 | **Hipodromo** | 1 | Catcalling | ✅ LOW | P2 — in core zone, single confirmed |
| 20 | **NDC Compound** | 1 | Poor Lighting | ✅ LOW | P2 — in core zone, confirmed dark |
| 21 | **LRT-2 V. Mapa Station** | 1 | Theft | 🔶 LOW | P3 — single report, sindikato mention |

---

---

## 2. Per-Location Deep Analysis

---

### 🔴 P1 — LRT-2 Pureza Station
**Reports: 16 | Severity: CRITICAL | Verification: MIXED**

The highest-report location in the dataset. Incidents span the station exit,
surrounding sidewalks, and the trike terminal. The most complex location because
it combines multiple distinct sub-zones (north exit, south Jollibee/Chowking exit,
overpass, trike terminal) each with different risk types.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Theft (pickpocket, bag-slash) | 5 | ✅ CONFIRMED (CCTV arrest, multiple Reddit) |
| Poor Lighting / Unsafe Area | 4 | ✅ CONFIRMED (multiple first-party) |
| Groping / Harassment | 3 | ✅ CONFIRMED (first-party interviews) |
| Overcharging / Scam | 3 | ✅ CONFIRMED (first-party + Reddit) |
| Other (workarounds, advisories) | 2 | ✅ CONFIRMED (Reddit Tier A) |
| Verbal Harassment | 1 | ✅ CONFIRMED (r/PUPians) |

**Key patterns:**
- **South exit (Jollibee/Chowking side):** pickpocketing by minors, bag-slashing reported in multiple posts — one bag was slashed while commuter was facing forward. CCTV arrest confirms this is recurring.
- **Overpass/underpass area:** dark at night, confirmed follower incident — "I was trying to lose him until I found someone else to walk with."
- **Trike terminal:** predatory special fares for lone riders, confirmed. Community workaround (group-forming to force ₱10 standard) is the HIGHEST-VALUE SIGNAL in the original evidence register — this is observed behavior, not just reported.
- **Station stairs:** groping on stairs while descending, crowded — "madaming tao kaya akala niya di ako makakapag-report."
- **Lighting:** dark after 8PM at the exit ramp side. Multiple independent posts confirm no street lighting on the gilid/side of the exit.

**Tier B items still needing live confirmation:**
- Pickpocketing by minors specifically at Jollibee/Chowking exit (Tier B — now corroborated by CCTV arrest report, can likely upgrade to Tier A)
- MoveIt driver harassment — flagged as "broader metro, not zone-specific"

**Interview questions for this location:**
1. "Do you use the south (Jollibee/Chowking) exit or another exit? Why?"
2. "Have you been overcharged by trikes here? What was the normal vs. charged amount?"
3. "Do you wait at the trike terminal alone or do you group up first?"
4. "Is the area near the overpass lit at night in your experience?"

---

### 🔴 P1 — Magsaysay Boulevard
**Reports: 11 | Severity: HIGH | Verification: MOSTLY CONFIRMED**

The main arterial road serving PUP. Incidents split between pedestrian and
jeepney/transport-based. Multiple confirmed armed incidents.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Snatching | 4 | ✅ CONFIRMED (news + first-party) |
| Poor Lighting / Unsafe Area | 3 | ✅ CONFIRMED (Reddit + direct interview) |
| Robbery (armed) | 2 | ✅ CONFIRMED (GMA News armed jeep holdup) |
| Overcharging / Scam | 1 | ✅ CONFIRMED (direct experience) |
| Verbal Harassment | 1 | ✅ CONFIRMED (direct interview — Sarah) |
| Theft | 1 | ✅ CONFIRMED (jeep robbery witness) |

**Key patterns:**
- **Motor snatching:** riding-in-tandem snatch, jewelry and cellphone targeted especially during traffic. Victim dragged (Philippine News Agency confirmed, 2021).
- **Jeepney armed holdap:** GMA News confirmed armed man boarding jeep on Ramon Magsaysay Blvd with patalim, 5 passengers — 2024.
- **Jeepney-specific modus:** ketchup/water spill distraction before snatching (Tier B — not yet independently confirmed but consistent with broader Recto-area patterns).
- **Dark alleys:** students actively avoid side streets off Magsaysay at night.
- **Physical assault:** man punched a jeep passenger at 4PM on the Pureza-Recto route — daylight incident, not just a night risk.
- **Workaround behavior confirmed:** women report changing routes, 75% would alter route after dark (global survey, directional).

**Interview questions for this location:**
1. "Do you take jeepneys on Magsaysay after dark? What time do you cut off?"
2. "Have you seen or experienced snatching on a jeep on this route?"
3. "Do you avoid specific side streets off Magsaysay? Which ones and why?"
4. "Have you paid for a ride-hailing service to avoid walking this stretch?"

---

### 🔴 P1 — Recto Avenue
**Reports: 9 | Severity: HIGH | Verification: COMMUNITY-CONFIRMED**

Outside the immediate PUP block but a critical transit corridor for students.
All 9 reports are community-sourced from Reddit — no first-party interview data yet.
Incident pattern is overwhelmingly pickpocket/theft in broad daylight.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Theft | 7 | ⚠️ MULTI-SOURCE (5+ independent Reddit posts) |
| Unsafe Infrastructure | 1 | ⚠️ MULTI-SOURCE |
| Robbery | 1 | ⚠️ CONFIRMED (r/TanongLang 2026) |

**Key patterns:**
- **Broad daylight pickpocketing is the norm, not the exception.** Multiple independent posters across years (2024, 2025, 2026) describe the same thing: bag pocket opened while walking, often unnoticed until after.
- **Organized syndicates:** minor thieves (children as young as <10) used as primary actors. Adults on standby. Multiple posts mention groups, not solo thieves.
- **Documented modus operandi:**
  - *Bump-and-grab distraction*: two people sandwich the target while walking — one bumps from front, one from behind, steal during confusion (confirmed, 2026-05).
  - *Coin drop distraction*: someone drops coins in front of you; accomplice behind takes phone from pocket while you're distracted (confirmed, 2024).
  - *Solo bag-opener*: walks directly behind target, opens backpack side pocket while in stride. Brazenly confident — thief "laughed" when called out.
- **Isetann / LRT exit area** is a specific hotspot — multiple mentions of the area between the LRT Recto exit stairs and Isetann department store.
- **Sidewalk obstruction:** vendors permanently blocking LRT Recto sidewalk exits, forcing commuters into narrower paths (easier target concentration).

**Interview questions for this location:**
1. "Do you walk through Recto to get to LRT? Which part feels most risky?"
2. "Have you experienced or witnessed a pickpocket or snatch here?"
3. "Do you hold your bag differently when you walk through Recto vs. other streets?"

---

### 🔴 P1 — Teresa Street
**Reports: 9 | Severity: HIGH | Verification: MIXED (Tier B core + confirmed incidents)**

GuidHer's primary target street — the main pedestrian artery from PUP to Pureza LRT.
Several confirmed first-party incidents but the core behavioral patterns are still
Tier B (evidence-register desk research). This is the single most important location
to validate with live user interviews.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Snatching | 4 | ✅ CONFIRMED (3 first-party, 1 eyewitness) |
| Poor Lighting / Unsafe Area | 2 | 🔶 UNVERIFIED (Tier B) |
| Robbery (armed) | 1 | ✅ CONFIRMED (r/PUPians, saksakan firsthand) |
| Other (workarounds) | 2 | ✅ CONFIRMED (Reddit Tier A) |
| Unsafe Infrastructure | 1 | ✅ CONFIRMED (trike obstruction) |

**Key patterns:**
- **Phone and bag snatching confirmed multiple times:** at least 3 independent first-party reports of grab-and-run. Maria's report (7PM, konti tao), classmate report (bag + phone + wallet), and eyewitness report (morning, saw the run). These are different incidents.
- **Armed incidents confirmed:** PUPians post confirms firsthand witness to saksakan (stabbing) and a holdup near the PNR — this is higher severity than the grab-and-run pattern.
- **Community behavioral workarounds confirmed (Tier A):** bag-on-chest, walk fast, killer look, travel in groups — these are active daily self-protection routines, not one-off tips.
- **Infrastructure hazard:** trike parking blocks pedestrian lane, especially midday. Multiple near-misses reported.
- **Dark areas and mud (Tier B — UNVERIFIED):** the claim of makeshift bridges and mud on Teresa St is still unverified. It was the original Tier B item. The physical obstruction/trike item corroborates poor infrastructure generally.

**Tier B items status after new data:**
- Snatch/holdup at night → **UPGRADE TO TIER A** (3+ independent first-party confirms)
- Bag-on-chest behavior → **UPGRADE TO TIER A** (Reddit Tier A + consistent across posts)
- Mud/makeshift bridges → **STILL UNVERIFIED** — no new data confirms this

**Interview questions for this location:**
1. "What time do you use Teresa Street? Do you avoid it at any time?"
2. "Have you or someone you know been snatched on Teresa Street?"
3. "Do you change how you carry your bag specifically on Teresa Street?"
4. "Are there specific parts of Teresa (near LRT, near PNR, near barangay hall) that feel worse?"

---

### 🔴 P1 — LRT-2 Legarda Station
**Reports: 7 | Severity: HIGH | Verification: CONFIRMED**

Strong confirmed evidence. Three distinct sub-problems: pickpocketing inside/on
the train, outside the station exits, and the dark Estero approach.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Theft | 4 | ✅ CONFIRMED (2 first-party r/makati, 1 news, 1 advisory) |
| Poor Lighting / Unsafe Area | 2 | ✅ CONFIRMED (first-party + Tier B) |
| Snatching | 2 | ✅ CONFIRMED (news, r/Philippines) |

**Key patterns:**
- **Active syndicate on the train confirmed:** commuter chased thieves from Legarda all the way to Pureza station before police caught two. Professor advised victim to just let it go — institutional non-response confirmed.
- **Signalling modus confirmed:** students signal each other about who is being pickpocketed; victim only realized when calculator was gone at school. The "bystander signal" modus is a Legarda-specific pattern not seen as prominently elsewhere.
- **Police scope gap confirmed:** Legarda station police explicitly told victim that outside the station is "not our scope" — victims redirected to presinto. This is a direct barrier to reporting.
- **Dark exit toward Estero de San Miguel (Tier B):** still listed as unverified but corroborated by the community observation about no CCTV/security at the NDC-side exit.
- **Phone snatching outside station confirmed:** tricycle-borne snatcher nabbed victim in dark streets near Legarda, 2021 (GMA News confirmed, suspects arrested).

**Interview questions for this location:**
1. "Have you been pickpocketed on the LRT-2 between Legarda and Pureza stations?"
2. "Which exit of Legarda do you use at night? Is it well-lit?"
3. "Did you know that the station police say outside is 'not their scope'? Does this affect whether you'd report?"
4. "Have you seen people signalling each other about pickpockets on this stretch?"

---

### ⚠️ P1 — Recto Legarda (Corridor)
**Reports: 5 | Severity: HIGH | Verification: CONFIRMED**

A short but high-risk walking corridor. Disproportionately severe relative to
report count — 3 of 5 reports involve weapons.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Robbery (armed) | 3 | ✅ CONFIRMED (r/TanongLang, r/unpopularopinionph, r/Philippines) |
| Poor Lighting / Unsafe Area | 2 | ✅ CONFIRMED + 🔶 UNVERIFIED |

**Key patterns:**
- **Weapon-involved incidents are the norm here, not the exception.** Three independent confirmed reports of patalim (bladed weapon) threats. The Recto underpass holdup flopped only because the victim ran into traffic. The Isetan tulay incident involved someone approaching from behind with a sharp object. CEU corner jeep involved two-man armed board.
- **3-5 AM unsafe window (Tier B — UNVERIFIED but paid-avoidance corroborated):** Recto-Legarda is the only location with a confirmed *time-specific* paid avoidance behavior (moto-taxi fare paid specifically to avoid this walk). This is the strongest demand signal for GuidHer's time-aware routing.
- **P. Campa alternative route is the community-validated workaround** for this corridor — actively recommended in 2026.

**Interview questions for this location:**
1. "Do you walk from Recto station to Legarda station or vice versa? At what time?"
2. "Have you taken a moto-taxi specifically because you didn't want to walk this stretch?"
3. "Do you know the P. Campa alternative route? Do you use it?"
4. "Has anyone tried to rob you or felt like they were about to on this stretch?"

---

### ⚠️ P2 — España Boulevard
**Reports: 7 | Severity: HIGH | Verification: COMMUNITY-CONFIRMED**

Outside the PUP core zone but a major transit artery for university students
(UST, FEU-adjacent, Sampaloc commuters). Strong dual pattern of poor lighting and
active theft.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Poor Lighting / Unsafe Area | 3 | ⚠️ MULTI-SOURCE (Reddit + Tomasino) |
| Theft | 3 | ⚠️ MULTI-SOURCE (Reddit + first-party) |
| Groping / Harassment | 1 | ✅ CONFIRMED (first-party, r/studentsph) |

**Key patterns:**
- **Streetlights frequently off or broken**, especially between P. Noval and UST. One post attributes this to flood-prevention protocols during typhoon season — a systemic, seasonal infrastructure problem, not just neglect.
- **Rugby users near UST España** confirmed as a safety concern — open substance use in public makes the street unpredictable at night.
- **Theft in coffee shops and indoor spaces:** two children entered a café, distracted the group, and stole a wallet — incident happened fast, denial pattern when confronted.
- **Groping/solicitation confirmed:** woman approached by car at midnight for sex work solicitation — forced to walk fast toward an occupied space.
- **Large-denomination theft on jeep confirmed:** 30k in tuition money stolen from a student on a jeep along España — student hid money in sock due to fear of being robbed.

**Interview questions for this location:**
1. "Do you walk on España at night? What part feels most unsafe?"
2. "Have you experienced or seen theft in this area — street or inside venues?"
3. "Are the streetlights reliably on when you commute? Does it vary by season?"

---

### ⚠️ P2 — Lacson Avenue
**Reports: 6 | Severity: MEDIUM-HIGH | Verification: CONFIRMED**

Less foot-traffic than España, which paradoxically makes it more dangerous — fewer
witnesses, car-dominant street, poor lighting opposite UST.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Snatching | 2 | ✅ CONFIRMED (motor snatch + España-Lacson corner) |
| Poor Lighting / Unsafe Area | 2 | ⚠️ MULTI-SOURCE |
| Physical Assault | 1 | ✅ CONFIRMED (GMA News — youth riot) |
| Theft | 1 | ✅ CONFIRMED (España-Lacson corner pickpocket) |

**Key patterns:**
- **España-Lacson corner is a hotspot** — confirmed pickpocket with accomplices (victim chased thief but accomplices present), and a phone snatch at 5AM in front of UST-ER by motorcycle with pillion rider.
- **"Known hotspot for holdappers for years"** — community knowledge repeated across multiple r/Tomasino posts. Institutional knowledge, not a new development.
- **Dark opposite UST side** — the non-UST side of Lacson is significantly less lit and less trafficked.
- **Youth violence** — GMA-confirmed riot with students in uniform wielding batons and stones temporarily blocked traffic.
- **Riding-in-tandem snatch confirmed** — victim held bag tight, prevented theft but experienced the attempt.

---

### ⚠️ P1 — Pureza Street
**Reports: 6 | Severity: MEDIUM | Verification: MOSTLY CONFIRMED**

Directly adjacent to LRT-2 Pureza Station. The street-level complement to the
station data above. Two distinct problems: poor lighting and transport scams.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Poor Lighting / Unsafe Area | 3 | ✅ CONFIRMED (multi-source) |
| Theft | 2 | ✅ CONFIRMED (first-party) |
| Robbery | 1 | ✅ CONFIRMED (GMA News UV Express) |
| Overcharging / Scam | 1 | ✅ CONFIRMED (first-party, 80-peso trike fare) |

**Key patterns:**
- **Dark except at Magsaysay intersection:** consistent finding across multiple sources — the street gets darker at both ends, only well-lit at the main corner. Dark = suspect jeep estribo behavior, commuter refused to alight.
- **UV Express armed holdup confirmed (2023):** GMA News reported two suspects boarding UV Express at separate stops on Pureza before declaring holdup en route to Bacood. This is a transit-mode specific risk, not just street-level.
- **Children pickpockets confirmed:** "nadukutan ako once ng mga batang palaboy, di mo talaga mararamdaman" — confirms minor pickpockets active on Pureza St itself, not just the station exits.

---

### ⚠️ P2 — Morayta Street
**Reports: 5 | Severity: MEDIUM-HIGH | Verification: CONFIRMED**

University strip adjacent to Recto — FEU, review centers, boarding houses.
Distinct from Recto Avenue in that harassment and gender-targeted incidents are
more prominent here.

**Incident breakdown:**
| Type | Count | Status |
|---|---|---|
| Theft | 2 | ✅ CONFIRMED (multiple Reddit) |
| Robbery (armed) | 1 | ✅ CONFIRMED (balisong, r/Philippines 2025) |
| Groping / Harassment | 1 | ✅ CONFIRMED (exhibitionism, r/studentsph) |
| Catcalling | 1 | ✅ CONFIRMED (r/studentsph) |

**Key patterns:**
- **Armed robbery in broad daylight (3PM) confirmed:** balisong weapon shown, phone taken, victim told to cross the street and not look back. Bold, daytime execution.
- **Exhibitionism confirmed:** older man exposing himself near transit stop in the evening (6-7:30PM window). Unreported to authorities — victim just kept walking. Shows gender-specific risks that don't make the "crime" stats.
- **Catcalling with following behavior confirmed:** man followed commuter from FEU asking where she lives — "buti na lang pumasok ako sa convenience store" (used commercial space as safety refuge).
- **Pickpocket endemic:** even experienced commuters who walk fast with phone in pocket still get their backpacks opened — "there are really sharp ones."

---

### ⚠️ P2 — V. Mapa
**Reports: 2 | Severity: MEDIUM | Verification: CONFIRMED**

Small report count but both are confirmed with specific modus — crowd-squeeze
syndicate and footbridge avoidance. The avoidance of the footbridge is itself
behavioral evidence of perceived risk.

**Key patterns:**
- **Crowd-squeeze theft modus confirmed (2024):** group of males identified, squeezing commuter in crowd to create theft opportunity. Lady guard intervened — shows security presence is a mitigating factor.
- **Footbridge avoided (Tier B — UNVERIFIED):** still needs first-party confirmation but consistent with the crowd-squeeze pattern above.

---

## 3. Tier B Status Update

Cross-referencing original evidence-register.md Tier B items against new data:

| Tier B Item (Original) | New Data Status | Recommended Action |
|---|---|---|
| Teresa St snatch/holdup at night | ✅ 3+ first-party confirms | **UPGRADE to Tier A** |
| Teresa St bag-on-chest behavior | ✅ Reddit Tier A confirmed | **UPGRADE to Tier A** |
| Teresa St mud + makeshift bridges | 🔶 No new data | Keep Tier B — confirm in interview |
| Pureza LRT-2 pickpocketing by minors | ✅ CCTV arrest + Reddit | **UPGRADE to Tier A** |
| Pureza approaches poorly lit | ✅ Multiple first-party | **UPGRADE to Tier A** |
| Legarda east / Estero unlit blind spot | ⚠️ Corroborated indirectly | Upgrade to Tier B-strong |
| Recto-Legarda 3-5AM + moto-taxi | ⚠️ Paid-avoidance corroborated | Upgrade to Tier B-strong |
| P. Campa alternative route | ✅ Reddit 2026 confirms | **UPGRADE to Tier A** |
| V. Mapa footbridge avoided | 🔶 Crowd-squeeze corroborates | Keep Tier B — confirm in interview |
| Magsaysay jeep jump-in snatch | ✅ News + Reddit confirms | **UPGRADE to Tier A** |
| Jeepney ketchup/water modus | ⚠️ No new direct confirms | Keep Tier B |
| Pureza trike predatory fares | ✅ Multiple Reddit first-party | **UPGRADE to Tier A** |
| Pureza trike group-forming workaround | ✅ Widely corroborated | **UPGRADE to Tier A — HIGHEST VALUE** |
| Pureza→Bacood UV Express holdup | ✅ GMA News 2023 confirms | **UPGRADE to Tier A** |
| MoveIt driver harassment | 🔶 Still "broader metro" | Keep Tier B |

---

## 4. Interview Validation Priority Queue

For Alex's probe sheet — ordered by where a single real confirmation has the
highest product impact.

### Must-Confirm (P1)
These answer whether GuidHer's core routing decisions are grounded:

1. **Teresa Street dark segments + which specific segment feels worst**
   — Answers: where to place the primary condition pin, day vs. night differentiation
2. **Pureza trike overcharge + group-forming behavior**
   — Answers: whether the paid avoidance signal is real and current (₱10 vs. special fare)
3. **Legarda pickpocket signalling modus**
   — Answers: how organized the threat is, what commuters already know
4. **Recto-Legarda late-night walk vs. moto-taxi decision**
   — Answers: is there a time-window routing feature that women would actually use?

### Should-Confirm (P2)
These strengthen the data or kill Tier B items:

5. Teresa St mud/makeshift bridges — current physical condition
6. V. Mapa footbridge avoidance — current behavior
7. Legarda exit lighting — which exit, current state
8. España Boulevard streetlights — seasonal vs. permanent

### Nice-to-Confirm (P3)
These add depth but don't change routing decisions:

9. Morayta exhibitionism/catcalling — frequency, time of day
10. LRT-2 Cubao walkway snatcher density — for future expansion scope

---

## 5. What This Changes for the Pitch

### Scoreboard update (vs. original evidence-register.md §0)

| Floor requirement | Status in original register | Status now |
|---|---|---|
| ≥3 behavioral callouts | Met on paper (Tier A) | **Met with conviction** — 30+ confirmed `did` reports |
| ≥3 distinct sources | Met (Tier A) | **Met strongly** — Reddit, news, first-party, Facebook, academic |
| ≥1 `paid` | NOT MET | **Closer** — moto-taxi avoidance + Angkas surge confirmed; still not WTP for *info product* |

### Strongest new evidence for the pitch

1. **Teresa Street snatching is confirmed by 3 independent first-party reports** — no longer a desk-research hypothesis. This is the answer to "is the problem real?"
2. **Pureza trike group-forming** is now the best behavioral evidence in the dataset — it shows women are *already* doing informal collective safety management. GuidHer formalizes this.
3. **Legarda police scope gap ("not our scope")** is a direct quote confirming institutional absence — this is the "strong institutions" rubric angle for the pitch.
4. **Recto-Legarda armed incidents at multiple time windows** — not just 3-5AM. Weapons confirmed in daylight (Morayta 3PM) and evening (Recto corridor). Broadens the time-aware routing case.

---

*Generated 2026-07-06 from crime-reports-MERGED.csv (99 rows, 21 locations).*
*Cross-referenced against evidence-register.md (last updated 2026-06-30).*
*Next update: after July 9 pitch interviews confirm/kill Tier B items.*
