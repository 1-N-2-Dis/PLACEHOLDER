// Canonical client-side copy of backend/data/heatmap-baseline.json's `segments[]` — 99
// community-sourced incidents collapsed to one baseline hotspot per location (news/forum/first-
// party sourced, see docs/HEATMAP_INTEGRATION_GUIDE.md). Single source of truth for both:
//   - the visual heatmap layer (ReportHeatmap.jsx)
//   - route avoidance (ZoneMap.jsx flaggedReports, merged with live Firestore reports)
//
// Carries its own `geo` per entry (unlike live reports, which only carry a segmentId and are
// joined against SEED_SEGMENTS/WELL_USED_SEGMENTS) so a hotspot works even for locations with no
// matching entry in the frontend's static segment list — e.g. seg_magsaysay_jeeps, which has no
// SEED_SEGMENTS/WELL_USED_SEGMENTS counterpart and previously rendered nothing anywhere.
//
// Same shape as backend/scripts/seed-heatmap-baseline.mjs's BASELINE_REPORTS — this is the
// baked-in equivalent for when that script hasn't been run against a live Firestore project.
// green severity (seg_pcampa_altroute) is a safe-alternative advisory, never an avoid penalty —
// consumers must filter to severity in {red, yellow} before using this for avoidance, same rule
// as live reports (routing.js, heatmap.js).
export const HEATMAP_BASELINE = [
  {
    segmentId: 'seg_pureza_approaches',
    name: 'Pureza station approaches',
    geo: { lat: 14.59859, lng: 121.0048 },
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Multiple incidents reported near station exits',
    note: 'Station exits reported as poorly lit after 8 PM. Multiple accounts of bag-slashing and unwanted contact on stairs. Trike terminal has reported overcharging for solo riders.',
    corroborationCount: 5,
  },

  {
    segmentId: 'seg_recto_legarda',
    name: 'Recto–Legarda environs',
    geo: { lat: 14.6035, lng: 120.9968 },
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Armed incidents reported along this corridor',
    note: 'This corridor has multiple confirmed reports of weapon-involved incidents. The stretch under and near the LRT station is poorly lit. Consider the P. Campa alternative route.',
    corroborationCount: 5,
  },
  {
    segmentId: 'seg_teresa_wellused_1',
    name: 'Teresa Street 1',
    geo: { lat: 14.60026, lng: 121.01279 },
    conditionType: 'recent_incident',
    severity: 'red',
    title: 'Grab-and-run incidents reported on this stretch',
    note: 'Multiple reports of phone and bag snatching, especially at low foot-traffic times. Travel with others if possible and keep valuables secured inside your bag.',
    corroborationCount: 5,
  },
  {
    segmentId: 'seg_legarda_estero',
    name: 'Legarda east / Estero de San Miguel',
    geo: { lat: 14.601, lng: 120.9975 },
    conditionType: 'poor_lighting',
    severity: 'yellow',
    title: 'Poorly lit exit toward Estero — stay alert',
    note: 'The east exit toward the estero is unlit after sunset with limited security. Pickpocketing has been reported on the platform and inside the train on this stretch.',
    corroborationCount: 4,
  },
  {
    segmentId: 'seg_pureza_st_1',
    name: 'Pureza Street 1',
    geo: { lat: 14.60306, lng: 121.00395 },
    conditionType: 'poor_lighting',
    severity: 'yellow',
    title: 'Street poorly lit away from Magsaysay intersection',
    note: 'Pureza Street is only well-lit at the main intersection. Both ends are significantly darker. Stay alert when boarding or alighting from jeepneys at poorly lit stops.',
    corroborationCount: 3,
  },
  {
    segmentId: 'seg_anonas_st_3',
    name: 'Anonas Street 3',
    geo: { lat: 14.59875, lng: 121.00546 },
    conditionType: 'recent_incident',
    severity: 'yellow',
    title: 'Pickpocket advisory near Mass Comm building',
    note: 'Pickpockets target people unfamiliar with the area near the PUP Mass Comm building. Keep your bag in front of you and be aware of people following too closely.',
    corroborationCount: 2,
  },
  {
    segmentId: 'seg_vmapa_sm',
    name: 'V. Mapa → SM Sta. Mesa',
    geo: { lat: 14.602, lng: 121.0145 },
    conditionType: 'no_crowd',
    severity: 'yellow',
    title: 'Group-based theft reported near transit stop',
    note: 'Reports of coordinated theft using crowd pressure near the transit stop. Stay close to the platform edge and keep belongings secure in crowded queues.',
    corroborationCount: 2,
  },
  {
    segmentId: 'seg_hipodromo_st_2',
    name: 'Hipodromo Street 2',
    geo: { lat: 14.6013, lng: 121.00916 },
    conditionType: 'recent_incident',
    severity: 'yellow',
    title: 'Verbal harassment reported on this street',
    note: 'Verbal harassment has been reported on this stretch. Consider walking with company or taking a different route if you feel unsafe.',
    corroborationCount: 1,
  },
  {
    segmentId: 'seg_pcampa_altroute',
    name: 'P. Campa / Loyola / Dalupan alt-route',
    geo: { lat: 14.6055, lng: 120.993 },
    conditionType: 'no_crowd',
    severity: 'green',
    title: 'Quieter alternative route to Legarda',
    note: 'Community tip: P. Campa → Loyola → Dalupan → San Anton → Figueras is a quieter alternative to walking the Recto–Legarda corridor, especially late at night.',
    corroborationCount: 0,
  },
];
