// Seed segment pins for the SaferRoute zone map.
// Role: starting map content so F-001 has something to render before any user reports exist.
// Traces to: idea.md §7 (8 provisional pins), docs/09-data-model.md (segment shape).
//
// [unverified] DEMO CONTENT, NOT EVIDENCE. The 8 pins are "confirm or kill" hypotheses from the
// Sta. Mesa hyperlocal scrape (Tier B). Coordinates are APPROXIMATE placeholders for the demo;
// confirm in field-walks post-July-2. Conditions are framed as observable states — never crime-zone
// labels (BR-001). The `note` here is descriptive context for the demo map, not a stored crime
// classification.
//
// Segment shape (point geometry per build decision): { segmentId, name, geo: { lat, lng } }.
// Conditions are framed as observable states — never crime-zone labels (BR-001). The `note` here is
// descriptive context for the demo map, not a stored crime classification.

export const SEED_SEGMENTS = [
  // Repositioned 2026-07-01 (later same day) — the previous placeholder (14.5985, 121.0040) was
  // reported wrong. Now the end of the real "Pureza Street" OSM way nearest where the removed
  // "Pureza LRT-2 south exit" pin used to be (see WELL_USED_SEGMENTS' Pureza Street points for
  // the rest of that street). "Pureza LRT-2 south exit", "Magsaysay Blvd / Old Sta. Mesa jeepney
  // route", and "Teresa St (PUP side)" removed on request (same day, later passes).
  { segmentId: 'seg_pureza_approaches', name: 'Pureza station approaches', geo: { lat: 14.59859, lng: 121.0048 } },
  { segmentId: 'seg_legarda_estero', name: 'Legarda east / Estero de San Miguel', geo: { lat: 14.6010, lng: 120.9975 } },
  { segmentId: 'seg_recto_legarda', name: 'Recto–Legarda environs', geo: { lat: 14.6035, lng: 120.9968 } },
  { segmentId: 'seg_vmapa_sm', name: 'V. Mapa → SM Sta. Mesa', geo: { lat: 14.6020, lng: 121.0145 } },
  { segmentId: 'seg_pcampa_altroute', name: 'P. Campa / Loyola / Dalupan alt-route', geo: { lat: 14.6055, lng: 120.9930 } },
];

// Well-used streets around PUP — added on request, so a route through them shows up green
// (informational/low-concern default) on the zone map and can be selected for a risk summary
// even before any report exists on them. These carry NO condition/severity by design: a segment
// with no report renders green ("okay") per SegmentFlag.jsx's existing default, and only turns
// yellow/red once real reports + AI classification (F-006) land on it.
//
// [unverified] demo placement per this file's existing convention, not a field-confirmed pin —
// but coordinates below (2026-07-01, later same day, revised twice) are sourced from real
// OpenStreetMap street geometry via the Overpass API, not single-point geocoding: for each named
// street, the actual OSM way(s) were fetched, same-named-but-unrelated streets elsewhere in
// Manila were filtered out by picking the cluster of fragments nearest a known-good reference
// point (not just "most fragments," which picked the wrong street the first time for Road 2/3
// and Valencia), the matching fragments were stitched into one polyline, and points were sampled
// at even arc-length intervals along it.
//
// Multi-point streets have their `name` suffixed with a number (e.g. "Anonas Street 1") so the
// segment picker in ReportForm.jsx / RouteCheck.jsx isn't a wall of identical labels — added on
// request. Road 1 and Road 5 (which already end in a number) use "Road 1 (1)" / "Road 5 (1)"
// instead, to avoid a confusing double-number like "Road 1 1".
export const WELL_USED_SEGMENTS = [
  // Pureza Street — 6 points, stitched from OSM way geometry (expanded from 2 on request).
  { segmentId: 'seg_pureza_st_1', name: 'Pureza Street 1', geo: { lat: 14.60306, lng: 121.00395 } },
  { segmentId: 'seg_pureza_st_2', name: 'Pureza Street 2', geo: { lat: 14.60442, lng: 121.00347 } },
  { segmentId: 'seg_pureza_st_3', name: 'Pureza Street 3', geo: { lat: 14.60417, lng: 121.00356 } },
  { segmentId: 'seg_pureza_st_4', name: 'Pureza Street 4', geo: { lat: 14.60281, lng: 121.00405 } },
  { segmentId: 'seg_pureza_st_5', name: 'Pureza Street 5', geo: { lat: 14.60145, lng: 121.00451 } },
  { segmentId: 'seg_pureza_st_6', name: 'Pureza Street 6', geo: { lat: 14.60002, lng: 121.00466 } },

  // Anonas Street — 8 points.
  { segmentId: 'seg_anonas_st_1', name: 'Anonas Street 1', geo: { lat: 14.59709, lng: 121.00184 } },
  { segmentId: 'seg_anonas_st_2', name: 'Anonas Street 2', geo: { lat: 14.59806, lng: 121.00359 } },
  { segmentId: 'seg_anonas_st_3', name: 'Anonas Street 3', geo: { lat: 14.59875, lng: 121.00546 } },
  { segmentId: 'seg_anonas_st_4', name: 'Anonas Street 4', geo: { lat: 14.59934, lng: 121.00738 } },
  { segmentId: 'seg_anonas_st_5', name: 'Anonas Street 5', geo: { lat: 14.60002, lng: 121.00927 } },
  { segmentId: 'seg_anonas_st_6', name: 'Anonas Street 6', geo: { lat: 14.59979, lng: 121.01116 } },
  { segmentId: 'seg_anonas_st_7', name: 'Anonas Street 7', geo: { lat: 14.59848, lng: 121.01265 } },
  { segmentId: 'seg_anonas_st_8', name: 'Anonas Street 8', geo: { lat: 14.59692, lng: 121.01266 } },

  // V. Francisco Street — 2 points.
  { segmentId: 'seg_v_francisco_st_1', name: 'V. Francisco Street 1', geo: { lat: 14.60106, lng: 121.01210 } },
  { segmentId: 'seg_v_francisco_st_2', name: 'V. Francisco Street 2', geo: { lat: 14.59981, lng: 121.01312 } },

  { segmentId: 'seg_altura_st', name: 'Altura Street', geo: { lat: 14.60002, lng: 121.01164 } },

  // Albina Street — 2 points.
  { segmentId: 'seg_albina_st_1', name: 'Albina Street 1', geo: { lat: 14.60127, lng: 121.01192 } },
  { segmentId: 'seg_albina_st_2', name: 'Albina Street 2', geo: { lat: 14.60087, lng: 121.01150 } },

  // Altura Extension — 3 points.
  { segmentId: 'seg_altura_ext_1', name: 'Altura Extension 1', geo: { lat: 14.60109, lng: 121.01064 } },
  { segmentId: 'seg_altura_ext_2', name: 'Altura Extension 2', geo: { lat: 14.60143, lng: 121.01017 } },
  { segmentId: 'seg_altura_ext_3', name: 'Altura Extension 3', geo: { lat: 14.60151, lng: 121.01030 } },

  { segmentId: 'seg_santol_ext', name: 'Santol Extension', geo: { lat: 14.60208, lng: 121.01125 } },

  // Teresa Street (well-used baseline; the cautionary "Teresa St (PUP side)" pin was removed on
  // request) — 2 points.
  { segmentId: 'seg_teresa_wellused_1', name: 'Teresa Street 1', geo: { lat: 14.60026, lng: 121.01279 } },
  { segmentId: 'seg_teresa_wellused_2', name: 'Teresa Street 2', geo: { lat: 14.59973, lng: 121.01233 } },

  // Hipodromo Street — 7 points.
  { segmentId: 'seg_hipodromo_st_1', name: 'Hipodromo Street 1', geo: { lat: 14.60065, lng: 121.00986 } },
  { segmentId: 'seg_hipodromo_st_2', name: 'Hipodromo Street 2', geo: { lat: 14.60130, lng: 121.00916 } },
  { segmentId: 'seg_hipodromo_st_3', name: 'Hipodromo Street 3', geo: { lat: 14.60120, lng: 121.00828 } },
  { segmentId: 'seg_hipodromo_st_4', name: 'Hipodromo Street 4', geo: { lat: 14.60180, lng: 121.00781 } },
  { segmentId: 'seg_hipodromo_st_5', name: 'Hipodromo Street 5', geo: { lat: 14.60101, lng: 121.00837 } },
  { segmentId: 'seg_hipodromo_st_6', name: 'Hipodromo Street 6', geo: { lat: 14.60063, lng: 121.00914 } },
  { segmentId: 'seg_hipodromo_st_7', name: 'Hipodromo Street 7', geo: { lat: 14.60068, lng: 121.00923 } },

  // Road 1-12 (Hipodromo grid). Repositioned 2026-07-01 (later same day) — the previous
  // placeholders were a manually-interpolated straight line; these are each that specific
  // numbered road's own real OSM way, filtered to the fragment near Hipodromo Street (several
  // "Road N" names collided with unrelated same-numbered streets elsewhere in Manila).
  // Road 1 — 2 points.
  { segmentId: 'seg_road_1_1', name: 'Road 1 (1)', geo: { lat: 14.59980, lng: 121.00718 } },
  { segmentId: 'seg_road_1_2', name: 'Road 1 (2)', geo: { lat: 14.59955, lng: 121.00720 } },

  { segmentId: 'seg_road_2', name: 'Road 2', geo: { lat: 14.59983, lng: 121.00688 } },
  { segmentId: 'seg_road_3', name: 'Road 3', geo: { lat: 14.59978, lng: 121.00662 } },

  // Road 5 — 4 points.
  { segmentId: 'seg_road_5_1', name: 'Road 5 (1)', geo: { lat: 14.59950, lng: 121.00657 } },
  { segmentId: 'seg_road_5_2', name: 'Road 5 (2)', geo: { lat: 14.59970, lng: 121.00718 } },
  { segmentId: 'seg_road_5_3', name: 'Road 5 (3)', geo: { lat: 14.59984, lng: 121.00780 } },
  { segmentId: 'seg_road_5_4', name: 'Road 5 (4)', geo: { lat: 14.60004, lng: 121.00841 } },

  { segmentId: 'seg_road_7', name: 'Road 7', geo: { lat: 14.59970, lng: 121.00890 } },
  { segmentId: 'seg_road_8', name: 'Road 8', geo: { lat: 14.60031, lng: 121.00921 } },
  { segmentId: 'seg_road_9', name: 'Road 9', geo: { lat: 14.60003, lng: 121.00918 } },
  { segmentId: 'seg_road_10', name: 'Road 10', geo: { lat: 14.59985, lng: 121.00987 } },
  { segmentId: 'seg_road_11', name: 'Road 11', geo: { lat: 14.59971, lng: 121.01005 } },
  { segmentId: 'seg_road_12', name: 'Road 12', geo: { lat: 14.59847, lng: 121.00668 } },

  // J.H. Panganiban Street — 4 points.
  { segmentId: 'seg_jh_panganiban_st_1', name: 'J.H. Panganiban Street 1', geo: { lat: 14.60001, lng: 121.00762 } },
  { segmentId: 'seg_jh_panganiban_st_2', name: 'J.H. Panganiban Street 2', geo: { lat: 14.60004, lng: 121.00693 } },
  { segmentId: 'seg_jh_panganiban_st_3', name: 'J.H. Panganiban Street 3', geo: { lat: 14.59998, lng: 121.00624 } },
  { segmentId: 'seg_jh_panganiban_st_4', name: 'J.H. Panganiban Street 4', geo: { lat: 14.59955, lng: 121.00594 } },

  // C. Arellano Street — 5 points.
  { segmentId: 'seg_c_arellano_st_1', name: 'C. Arellano Street 1', geo: { lat: 14.60128, lng: 121.00741 } },
  { segmentId: 'seg_c_arellano_st_2', name: 'C. Arellano Street 2', geo: { lat: 14.60124, lng: 121.00684 } },
  { segmentId: 'seg_c_arellano_st_3', name: 'C. Arellano Street 3', geo: { lat: 14.60117, lng: 121.00627 } },
  { segmentId: 'seg_c_arellano_st_4', name: 'C. Arellano Street 4', geo: { lat: 14.60111, lng: 121.00570 } },
  { segmentId: 'seg_c_arellano_st_5', name: 'C. Arellano Street 5', geo: { lat: 14.60105, lng: 121.00513 } },

  // Gregorio Araneta Street (new) — 2 points.
  { segmentId: 'seg_gregorio_araneta_st_1', name: 'Gregorio Araneta Street 1', geo: { lat: 14.60055, lng: 121.00610 } },
  { segmentId: 'seg_gregorio_araneta_st_2', name: 'Gregorio Araneta Street 2', geo: { lat: 14.60085, lng: 121.00607 } },

  // M. Araullo Street — 4 points.
  { segmentId: 'seg_m_araullo_st_1', name: 'M. Araullo Street 1', geo: { lat: 14.60062, lng: 121.00524 } },
  { segmentId: 'seg_m_araullo_st_2', name: 'M. Araullo Street 2', geo: { lat: 14.60068, lng: 121.00589 } },
  { segmentId: 'seg_m_araullo_st_3', name: 'M. Araullo Street 3', geo: { lat: 14.60075, lng: 121.00653 } },
  { segmentId: 'seg_m_araullo_st_4', name: 'M. Araullo Street 4', geo: { lat: 14.60082, lng: 121.00717 } },

  // Jose Abad Santos Street — 5 points.
  { segmentId: 'seg_jose_abad_santos_st_1', name: 'Jose Abad Santos Street 1', geo: { lat: 14.60042, lng: 121.00778 } },
  { segmentId: 'seg_jose_abad_santos_st_2', name: 'Jose Abad Santos Street 2', geo: { lat: 14.60036, lng: 121.00716 } },
  { segmentId: 'seg_jose_abad_santos_st_3', name: 'Jose Abad Santos Street 3', geo: { lat: 14.60029, lng: 121.00653 } },
  { segmentId: 'seg_jose_abad_santos_st_4', name: 'Jose Abad Santos Street 4', geo: { lat: 14.60023, lng: 121.00591 } },
  { segmentId: 'seg_jose_abad_santos_st_5', name: 'Jose Abad Santos Street 5', geo: { lat: 14.60017, lng: 121.00528 } },

  { segmentId: 'seg_fortuna_st', name: 'Fortuna Street', geo: { lat: 14.60145, lng: 121.00616 } },
  { segmentId: 'seg_cordero_st', name: 'Cordero Street', geo: { lat: 14.59917, lng: 121.00437 } },
  { segmentId: 'seg_piling_st', name: 'Piling Street', geo: { lat: 14.60046, lng: 121.00360 } },
  { segmentId: 'seg_d_ampil_st', name: 'D. Ampil Street', geo: { lat: 14.60069, lng: 121.00320 } },
  { segmentId: 'seg_de_dios_st', name: 'De Dios Street', geo: { lat: 14.60065, lng: 121.00275 } },
  { segmentId: 'seg_quintina_st', name: 'Quintina Street', geo: { lat: 14.60062, lng: 121.00228 } },

  // Valencia Street — 3 points (near De Dios/Duhat cluster; a same-named street fragment near
  // Legarda, ~1km away, was filtered out as unrelated — see file header).
  { segmentId: 'seg_valencia_st_1', name: 'Valencia Street 1', geo: { lat: 14.59755, lng: 121.00237 } },
  { segmentId: 'seg_valencia_st_2', name: 'Valencia Street 2', geo: { lat: 14.59875, lng: 121.00216 } },
  { segmentId: 'seg_valencia_st_3', name: 'Valencia Street 3', geo: { lat: 14.60000, lng: 121.00181 } },

  { segmentId: 'seg_duhat_st', name: 'Duhat Street', geo: { lat: 14.60001, lng: 121.00084 } },
  { segmentId: 'seg_nadelco_st', name: 'Nadelco Street', geo: { lat: 14.59989, lng: 121.00143 } },
  { segmentId: 'seg_ruiloba_st', name: 'Ruiloba Street', geo: { lat: 14.59849, lng: 121.00155 } },
  { segmentId: 'seg_a_vitan_st', name: 'A. Vitan Street', geo: { lat: 14.59804, lng: 121.00180 } },
  { segmentId: 'seg_v_mata_st', name: 'V. Mata Street', geo: { lat: 14.59754, lng: 121.00189 } },
  { segmentId: 'seg_acete_st', name: 'Acete Street', geo: { lat: 14.59699, lng: 121.00219 } },
];
