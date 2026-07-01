// Seed segment pins for the SaferRoute zone map.
// Role: starting map content so F-001 has something to render before any user reports exist.
// Traces to: idea.md §7 (8 provisional pins), docs/09-data-model.md (segment shape).
//
// [unverified] DEMO CONTENT, NOT EVIDENCE. The 8 pins are "confirm or kill" hypotheses from the
// Sta. Mesa hyperlocal scrape (Tier B). Coordinates are APPROXIMATE placeholders for the demo;
// confirm in field-walks post-July-2.
//
// Segment shape (point geometry per build decision): { segmentId, name, geo: { lat, lng } }.
// Conditions are framed as observable states — never crime-zone labels (BR-001). The `note` here is
// descriptive context for the demo map, not a stored crime classification.

export const SEED_SEGMENTS = [
  { segmentId: 'seg_teresa_st', name: 'Teresa St (PUP side)', geo: { lat: 14.5996, lng: 121.0108 } },
  { segmentId: 'seg_pureza_south_exit', name: 'Pureza LRT-2 south exit', geo: { lat: 14.5979, lng: 121.0030 } },
  { segmentId: 'seg_pureza_approaches', name: 'Pureza station approaches', geo: { lat: 14.5985, lng: 121.0040 } },
  { segmentId: 'seg_legarda_estero', name: 'Legarda east / Estero de San Miguel', geo: { lat: 14.6010, lng: 120.9975 } },
  { segmentId: 'seg_recto_legarda', name: 'Recto–Legarda environs', geo: { lat: 14.6035, lng: 120.9968 } },
  { segmentId: 'seg_vmapa_sm', name: 'V. Mapa → SM Sta. Mesa', geo: { lat: 14.6020, lng: 121.0145 } },
  { segmentId: 'seg_pcampa_altroute', name: 'P. Campa / Loyola / Dalupan alt-route', geo: { lat: 14.6055, lng: 120.9930 } },
  { segmentId: 'seg_magsaysay_jeeps', name: 'Magsaysay Blvd / Old Sta. Mesa jeepney route', geo: { lat: 14.5968, lng: 121.0085 } },
];
