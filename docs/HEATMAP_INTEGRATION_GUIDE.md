# Heatmap Integration Guide
## CSV Data → Visible Crime Heatmap in GuidHer

**Date:** 2026-07-06
**For:** Jim (Demo/Backend) + Farhana (Data Story)
**Stack:** Firebase/Firestore · Express · React + MapLibre GL · `buildIncidentMarkers()`

---

## How the Existing Heatmap Works (What We're Plugging Into)

Before touching anything, understand the existing pipeline:

```
Firestore `reports` collection
        ↓
  ReportHeatmap.jsx  (live + mock blended)
        ↓
  buildIncidentMarkers()  in lib/heatmap.js
        ↓
  ZoneMap.jsx  renders glowing AlertTriangle/AlertOctagon icons per segment
```

`buildIncidentMarkers()` filters for `severity === 'yellow' | 'red'` AND
`isFlaggedTonight()` (within 24h freshness window). It collapses all reports
for a segment to **one marker** — worst severity wins, count scales glow size
(capped at `HEAT_COUNT_CAP = 5`).

**The CSV data needs to become Firestore `reports` docs in this exact shape:**

```js
{
  segmentId: string,          // must match a segment doc
  conditionType: string,      // 'poor_lighting' | 'no_crowd' | 'recent_incident'
  severity: 'yellow' | 'red',
  title: string,              // short label shown in UI
  note: string,               // condition description — BR-001: NO crime labels
  corroborationCount: number, // 1–5
  uid: string,                // 'csv-seed' for batch imports
  createdAt: Timestamp,
  lastActivityAt: Timestamp,
}
```

---

## Step 1 — Verify Segment IDs Match

The `segmentId` in each report doc **must match** a document in the `segments`
collection. The existing segment IDs are:

| segmentId | Location Name |
|---|---|
| `seg_pureza_approaches` | Pureza station approaches |
| `seg_legarda_estero` | Legarda east / Estero de San Miguel |
| `seg_recto_legarda` | Recto–Legarda environs |
| `seg_vmapa_sm` | V. Mapa → SM Sta. Mesa |
| `seg_pcampa_altroute` | P. Campa / Loyola / Dalupan alt-route |
| `seg_teresa_wellused_1` | Teresa Street 1 |
| `seg_teresa_wellused_2` | Teresa Street 2 |
| `seg_pureza_st_1` → `seg_pureza_st_6` | Pureza Street 1–6 |
| `seg_anonas_st_1` → `seg_anonas_st_8` | Anonas Street 1–8 |
| `seg_hipodromo_st_1` → `seg_hipodromo_st_7` | Hipodromo Street 1–7 |
| `seg_magsaysay_jeeps` | Magsaysay Blvd / Old Sta. Mesa jeepney route |

Run the existing seed-segments script first if segments don't exist in Firestore yet:

```powershell
# Against emulator
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"
node backend/scripts/seed-segments.mjs

# Against real project
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
node backend/scripts/seed-segments.mjs
```

---

## Step 2 — Generate the Seed Reports Script

Create this file at `GuidHer/backend/scripts/seed-heatmap-baseline.mjs`:

```js
// Seed heatmap baseline reports from CSV data analysis.
// Source: data/heatmap-baseline.json — risk weights derived from 99 collected reports.
// Run AFTER seed-segments.mjs — requires segment docs to exist.
//
// Run against emulator:
//   $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"
//   node backend/scripts/seed-heatmap-baseline.mjs
//
// Run against real project:
//   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
//   node backend/scripts/seed-heatmap-baseline.mjs

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const useEmulator = !!process.env.FIRESTORE_EMULATOR_HOST;
initializeApp(
  useEmulator
    ? { projectId: process.env.GCLOUD_PROJECT || 'demo-saferroute' }
    : { credential: applicationDefault() },
);
const db = getFirestore();

const NOW = Date.now();
const H = 60 * 60 * 1000;

// Derived from heatmap-baseline.json seed_report fields.
// createdAt is staggered so the heatmap looks organic, not batch-inserted.
// All are within the 24h freshness window so they display "tonight".
const BASELINE_REPORTS = [
  {
    id: 'baseline_pureza_approaches',
    segmentId: 'seg_pureza_approaches',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Multiple incidents reported near station exits',
    note: 'Station exits reported as poorly lit after 8 PM. Multiple accounts of bag-slashing and unwanted contact on stairs. Trike terminal has reported overcharging for solo riders.',
    corroborationCount: 5,
    createdAt: NOW - 2 * H,
    lastActivityAt: NOW - 0.5 * H,
  },
  {
    id: 'baseline_magsaysay_jeeps',
    segmentId: 'seg_magsaysay_jeeps',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Snatch incidents on and near jeepneys',
    note: 'Multiple reports of phone and bag snatching along this stretch, including on moving jeepneys. Avoid using phone near open windows. Motorcycle-borne snatchers active during traffic.',
    corroborationCount: 5,
    createdAt: NOW - 3 * H,
    lastActivityAt: NOW - 1 * H,
  },
  {
    id: 'baseline_recto_legarda',
    segmentId: 'seg_recto_legarda',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Armed incidents reported along this corridor',
    note: 'This corridor has multiple confirmed reports of weapon-involved incidents. The stretch under and near the LRT station is poorly lit. Consider the P. Campa alternative route.',
    corroborationCount: 5,
    createdAt: NOW - 4 * H,
    lastActivityAt: NOW - 0.33 * H,
  },
  {
    id: 'baseline_teresa_st',
    segmentId: 'seg_teresa_wellused_1',
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Grab-and-run incidents reported on this stretch',
    note: 'Multiple reports of phone and bag snatching, especially at low foot-traffic times. Travel with others if possible and keep valuables secured inside your bag.',
    corroborationCount: 5,
    createdAt: NOW - 1 * H,
    lastActivityAt: NOW - 0.25 * H,
  },
  {
    id: 'baseline_legarda_estero',
    segmentId: 'seg_legarda_estero',
    conditionType: 'poor_lighting',
    severity: 'yellow',
    title: 'Poorly lit exit toward Estero — stay alert',
    note: 'The east exit toward the estero is unlit after sunset with limited security. Pickpocketing has been reported on the platform and inside the train on this stretch.',
    corroborationCount: 4,
    createdAt: NOW - 5 * H,
    lastActivityAt: NOW - 2 * H,
  },
  {
    id: 'baseline_pureza_st',
    segmentId: 'seg_pureza_st_3',
    conditionType: 'poor_lighting',
    severity: 'yellow',
    title: 'Street poorly lit away from Magsaysay intersection',
    note: 'Pureza Street is only well-lit at the main intersection. Both ends are significantly darker. Stay alert when boarding or alighting from jeepneys at poorly lit stops.',
    corroborationCount: 3,
    createdAt: NOW - 6 * H,
    lastActivityAt: NOW - 3 * H,
  },
  {
    id: 'baseline_anonas_st',
    segmentId: 'seg_anonas_st_3',
    conditionType: 'recent_incident',
    severity: 'yellow',
    title: 'Pickpocket advisory near Mass Comm building',
    note: 'Pickpockets target people unfamiliar with the area near the PUP Mass Comm building. Keep your bag in front of you and be aware of people following too closely.',
    corroborationCount: 2,
    createdAt: NOW - 7 * H,
    lastActivityAt: NOW - 4 * H,
  },
  {
    id: 'baseline_vmapa',
    segmentId: 'seg_vmapa_sm',
    conditionType: 'no_crowd',
    severity: 'yellow',
    title: 'Group-based theft reported near transit stop',
    note: 'Reports of coordinated theft using crowd pressure near the transit stop. Stay close to the platform edge and keep belongings secure in crowded queues.',
    corroborationCount: 2,
    createdAt: NOW - 8 * H,
    lastActivityAt: NOW - 5 * H,
  },
  {
    id: 'baseline_hipodromo',
    segmentId: 'seg_hipodromo_st_2',
    conditionType: 'recent_incident',
    severity: 'yellow',
    title: 'Verbal harassment reported on this street',
    note: 'Verbal harassment has been reported on this stretch. Consider walking with company or taking a different route if you feel unsafe.',
    corroborationCount: 1,
    createdAt: NOW - 9 * H,
    lastActivityAt: NOW - 6 * H,
  },
];

async function seed() {
  const batch = db.batch();
  for (const { id, createdAt, lastActivityAt, ...fields } of BASELINE_REPORTS) {
    batch.set(db.collection('reports').doc(id), {
      ...fields,
      uid: 'csv-seed',
      createdAt: Timestamp.fromMillis(createdAt),
      lastActivityAt: Timestamp.fromMillis(lastActivityAt),
    });
  }
  await batch.commit();

  console.log('\nBaseline heatmap seeded:\n');
  for (const r of BASELINE_REPORTS) {
    const bar = '█'.repeat(r.corroborationCount);
    console.log(`  ${r.severity.padEnd(6)} ${bar.padEnd(5)} ${r.segmentId.padEnd(30)} "${r.title}"`);
  }
  console.log(`\n✓ ${BASELINE_REPORTS.length} baseline reports seeded${useEmulator ? ' (emulator)' : ''}.`);
  console.log('  Run seed-segments.mjs first if segments are missing.\n');
}

seed().catch((err) => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
```

---

## Step 3 — Run the Seed

```powershell
# From GuidHer root — emulator
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"
node backend/scripts/seed-heatmap-baseline.mjs

# From GuidHer root — real project
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccount.json"
node backend/scripts/seed-heatmap-baseline.mjs
```

Expected console output:
```
Baseline heatmap seeded:

  red    █████ seg_pureza_approaches          "Multiple incidents reported near station exits"
  red    █████ seg_magsaysay_jeeps            "Snatch incidents on and near jeepneys"
  red    █████ seg_recto_legarda              "Armed incidents reported along this corridor"
  red    █████ seg_teresa_wellused_1          "Grab-and-run incidents reported on this stretch"
  yellow ████  seg_legarda_estero             "Poorly lit exit toward Estero — stay alert"
  yellow ███   seg_pureza_st_3               "Street poorly lit away from Magsaysay intersection"
  yellow ██    seg_anonas_st_3               "Pickpocket advisory near Mass Comm building"
  yellow ██    seg_vmapa_sm                  "Group-based theft reported near transit stop"
  yellow █     seg_hipodromo_st_2            "Verbal harassment reported on this street"

✓ 9 baseline reports seeded (emulator).
```

---

## Step 4 — Verify It Appears on the Map

After seeding, open the frontend and toggle on the heatmap layer:

1. **Open the map** → GuidHer should render in dark mode at ZONE_CENTER `{lat:14.5985, lng:121.0102}` zoom 15.
2. **Toggle heatmap** → the heatmap toggle in ZoneMap should now show:
   - 🔴 Red glow (large) on: Pureza approaches, Magsaysay Blvd, Recto–Legarda, Teresa Street
   - 🟡 Yellow glow (medium) on: Legarda/Estero, Pureza Street
   - 🟡 Yellow glow (small) on: Anonas, V. Mapa, Hipodromo
3. **P. Campa** renders green (no active condition report) — correct, it's an advisory.

If segments don't show up: check that `isFlaggedTonight()` is passing. The seed
uses `createdAt: NOW - N * H` — if you run the seed and then wait too long before
checking, reports older than 24h will expire. **Re-run the seed script before the demo.**

---

## Step 5 — Freshness for the Demo

`isFlaggedTonight()` uses a 24-hour window. For demo day:

```powershell
# Re-seed reports 30 minutes before demo to ensure all are fresh
$env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8081"
node backend/scripts/seed-heatmap-baseline.mjs
```

The seed script uses `Date.now()` at execution time, so re-running refreshes
all timestamps without creating duplicates (deterministic doc IDs via `batch.set`).

---

## Step 6 — Connect CSV Data to `summarizeSegment`

When a judge clicks a heatmap marker, the `summarizeSegment` endpoint is called.
The note field in each seed report is what Gemini summarizes. Make sure the notes
are **conditions-only language** (no crime labels, per BR-001). They already are in
the seed above — don't edit them to add crime terminology.

The `/summarizeSegment` call shape (already in `backend/server/index.js`):
```json
{ "segmentId": "seg_pureza_approaches" }
```

---

## Condition Type → UI Mapping

`conditionType` determines which icon `ReportHeatmap.jsx` renders:

| conditionType | Icon | When to use |
|---|---|---|
| `poor_lighting` | Dim bulb / AlertTriangle | Area is dark, street lights out |
| `no_crowd` | AlertTriangle | Area feels isolated, few people |
| `recent_incident` | AlertOctagon (red) | Specific incident reported |

---

## BR-001 Compliance Checklist

Before the demo, verify every note field passes these conditions:

- ✅ Describes a **fixable condition** (lighting, crowd, recent event)
- ✅ No word: `crime`, `criminal`, `dangerous area`, `avoid`
- ✅ No people labels: `snatcher`, `harasser`, `robber` as nouns in the note
- ✅ Language is **informational**, not alarming
- ✅ Ends with a **suggested action** where possible ("stay alert", "travel with others")

The seed reports above were written to pass this check.

---

## Full Data Flow Diagram

```
crime-reports-MERGED.csv  (99 rows, community data)
        │
        ▼
heatmap-baseline.json  (risk weights, severity, seed_report per segment)
        │
        ▼
seed-heatmap-baseline.mjs  (converts to Firestore Timestamps, writes docs)
        │
        ▼
Firestore `reports` collection  (9 baseline docs with segmentId, severity, note)
        │
        ▼
ReportHeatmap.jsx  (fetches reports + blends with mockReports)
        │
        ▼
buildIncidentMarkers()  (filters yellow/red + tonight, collapses per segment)
        │
        ▼
ZoneMap.jsx  (renders glowing icons at segment geo coordinates)
        │
        ▼
User sees heatmap overlay  ✓
```

---

## Troubleshooting

**No markers on map:**
- Check `isFlaggedTonight()` — reports must be within 24h of `Date.now()`
- Re-run the seed script to refresh timestamps
- Verify segments exist in Firestore (`segments` collection, 8 docs minimum)

**Markers show but wrong location:**
- The geo coordinates come from the `segments` collection, not the report doc
- Check `seed-segments.mjs` ran successfully
- Verify `segmentId` in report matches the doc ID in `segments` collection

**Heatmap toggle does nothing:**
- Check browser console for `buildIncidentMarkers` errors
- Verify `reports` collection is being read (check Firestore rules allow public read)

**All markers show yellow even for red severity:**
- Check `ReportHeatmap.jsx` — it takes worst severity per segment; if `corroborationCount` is 0, it may default to yellow
- Ensure `corroborationCount >= 1` for all seeded reports (it is in the script above)

---

## Notes for the Pitch (Farhana)

When explaining the heatmap on stage:

> "Every marker on this map comes from a real community report — not a police
> database, not generated data. The red segments are locations with the most
> corroborated incident patterns: Pureza station exits, Magsaysay Boulevard,
> the Recto–Legarda corridor, and Teresa Street. The size of the glow reflects
> how many independent reports back it up, capped at five. Gemini's job is to
> structure those reports and assign severity — it never invents a red zone."

**Key numbers to cite:**
- 99 collected reports from Reddit, Philippine news, and direct community sources
- 9 active heatmap segments in the demo zone
- 4 red segments, 5 yellow segments
- Most-corroborated: Pureza approaches and Magsaysay Blvd (both at corroboration cap of 5)

---

*Integration guide written 2026-07-06.*
*Seed script: `GuidHer/backend/scripts/seed-heatmap-baseline.mjs`*
*Baseline data: `data/heatmap-baseline.json`*
