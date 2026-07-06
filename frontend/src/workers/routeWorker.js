// Hosts the client-side Rust/WASM routing engine off the main thread (F-005, ADR-0003 — replaces
// OpenRouteService, see docs/06-system-design.md). Loaded lazily by lib/routing.js.
//
// Protocol: postMessage({ id, a, b, flaggedReports }) where a/b are [lat, lng] and flaggedReports
// is [{ geo: {lat,lng}, severity }, ...]. Replies with { id, routes } (exactly 1-2 entries, see
// the Rust crate's find_routes_internal) or { id, error }.
import init, { load_graph, set_penalties, find_routes } from '../wasm/router/router.js';

const GRAPH_URL = new URL('/graph/pup-20km.bin', self.location.origin).pathname;

// Single shared init — concurrent requests that arrive before the graph has loaded all await the
// same promise instead of each triggering their own fetch/init.
let readyPromise = null;
function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await init();
      const res = await fetch(GRAPH_URL);
      if (!res.ok) throw new Error(`Routing graph failed to load (${res.status})`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      load_graph(bytes);
    })();
  }
  return readyPromise;
}

function toReportInputs(flaggedReports) {
  return flaggedReports.map(({ geo, severity }) => ({ lat: geo.lat, lng: geo.lng, severity }));
}

self.onmessage = async ({ data }) => {
  const { id, a, b, flaggedReports } = data;
  try {
    await ensureReady();
    set_penalties(JSON.stringify(toReportInputs(flaggedReports)));
    const json = find_routes(a[1], a[0], b[1], b[0]); // (start_lng, start_lat, end_lng, end_lat)
    const { routes } = JSON.parse(json);
    postMessage({ id, routes });
  } catch (err) {
    postMessage({ id, error: err?.message || String(err) });
  }
};
