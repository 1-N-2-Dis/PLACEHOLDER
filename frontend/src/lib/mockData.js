// Mock route + zone data for guidHER prototype.
// Traces to: docs/06-system-design.md (F-005, client-side WASM routing engine — ADR-0003).

export const MOCK_ROUTES = [
  {
    id: 'route_pup_pureza',
    from: 'PUP Main Campus',
    to: 'LRT-2 Pureza Station',
    distance: '1.2 km',
    walkTime: '14 min',
    safetyScore: 92,
    tier: 'safest',
    status: 'safe',
    conditions: ['Well-lit path','Active foot traffic','Near commercial areas'],
    communityNote: 'Most commuters use this route. Generally safe during daytime and early evening.',
  },
  {
    id: 'route_pup_legarda',
    from: 'PUP Main Campus',
    to: 'LRT-2 Legarda Station',
    distance: '2.1 km',
    walkTime: '25 min',
    safetyScore: 74,
    tier: 'caution',
    status: 'caution-yellow',
    conditions: ['Passes estero area','Variable lighting','Moderate traffic'],
    communityNote: 'Use the well-lit Magsaysay Blvd path. Avoid estero shortcut after 8 PM.',
  },
  {
    id: 'route_pup_vmapa',
    from: 'PUP Main Campus',
    to: 'V. Mapa / SM Sta. Mesa',
    distance: '0.8 km',
    walkTime: '10 min',
    safetyScore: 88,
    tier: 'safest',
    status: 'safe',
    conditions: ['Short walk','Commercial area','Good lighting'],
    communityNote: 'Quick and direct. SM provides a safe wait area for jeepneys.',
  },
];

export const ZONE_OVERVIEW = [
  { name: 'PUP Campus Area', status: 'green', label: 'Active Zone', detail: 'Campus security present, good crowd density.' },
  { name: 'Pureza Station', status: 'yellow', label: 'Low crowd tonight', detail: 'Station underpass reported thin foot traffic.' },
  { name: 'Legarda Approach', status: 'yellow', label: 'Variable lighting', detail: 'Some streetlights out along estero side.' },
  { name: 'Magsaysay Blvd', status: 'green', label: 'Busy jeepney route', detail: 'Active commercial strip. Well-lit, good crowd.' },
  { name: 'V. Mapa / SM Area', status: 'green', label: 'Well-lit', detail: 'SM open. Good foot traffic around transport stops.' },
  { name: 'Recto–Legarda', status: 'red', label: 'Use caution', detail: 'Recent incident reported. Prefer Magsaysay route tonight.' },
];

export const SAFETY_TIPS = [
  { id: 'tip_plan', title: 'Plan before you go.', body: "Check tonight's route conditions before you leave. A 30-second check can make all the difference.", category: 'planning' },
  { id: 'tip_spot', title: 'Spot the conditions.', body: 'Notice lighting, crowd levels, and anything unusual. Your instinct is data — share it.', category: 'awareness' },
  { id: 'tip_share', title: 'Share what you see.', body: 'A quick report helps the next woman know what you know. Community knowledge keeps everyone safer.', category: 'community' },
  { id: 'tip_trust', title: 'Trust the feeling.', body: 'If something feels off, take a different route. No destination is worth compromising your safety.', category: 'awareness' },
  { id: 'tip_lrt', title: 'Time your LRT trip.', body: 'Pureza and Legarda stations are safest between 6–9 PM. The last few trains can get quiet.', category: 'planning' },
  { id: 'tip_jeepney', title: 'Know your jeepney stops.', body: 'Magsaysay Blvd jeepneys run until midnight. V. Mapa near SM is a well-lit transfer point.', category: 'transport' },
];

export function findRoutes(from, to) {
  const q = (from + ' ' + to).toLowerCase();
  if (!q.includes('pup') && !q.includes('pureza') && !q.includes('legarda') && !q.includes('mapa')) return MOCK_ROUTES;
  return MOCK_ROUTES;
}
