# ADR — Architecture Decision Record

> Append-only log. One entry per significant decision. Never edit a past entry — supersede it
> with a new one.

---

## ADR-0003 — Client-side Rust/WASM routing engine replaces OpenRouteService; routing capped at 2 routes

- **Date:** 2026-07-06
- **Status:** Accepted
- **Context:** F-005 point-to-point routing called OpenRouteService (ORS) from the browser
  (ADR-0001), with a client-side API key that shipped **unrestricted** in the bundle — an open
  security item (Security & Compliance, Threat T2) never resolved. ORS also meant an external
  runtime dependency: a routing failure or quota exhaustion at demo time had no fallback, and the
  1-3-route cascade added latency (up to 4 ORS calls per request). Separately, mentor feedback
  (Troy, via [Mentor Synthesis](../analysis/mentor-synthesis.md)) called for simplifying route
  choice down to a fixed "recommended + one alternative" shape rather than a variable 1-3 list —
  already tracked as an open decision in `docs/BUILD-GUIDE.md`/`docs/POSTMORTEM.md`.
- **Options considered:**
  1. **Keep ORS, finally restrict the key.** Fixes the open security item but not the
     external-dependency/cold-start risk, and does nothing about the route-count simplification.
  2. **Client-side Rust compiled to WebAssembly, running an A\* search in a Web Worker over a
     preprocessed OSM pedestrian graph.** No external routing API at request time — no key, no
     quota, no cold start; the demo keeps working even if a routing provider would have been
     down. Trade-off: a graph asset must be built ahead of time (Overpass fetch + compile) and
     shipped as a static file, and Vercel has no Rust toolchain, so both the compiled graph and
     the wasm-bindgen output are committed build artifacts rather than generated at deploy time.
  3. **A different third-party routing API (e.g. Mapbox Directions, Valhalla-hosted).** Same
     external-dependency risk class as ORS, just a different vendor; doesn't address the root
     concern.
- **Decision:** Option 2.
  - **Coverage:** a 20km-radius graph around `ZONE_CENTER` (`frontend/src/lib/maps.js`) —
    deliberately matching the existing 20km report-coverage radius
    (`ROAD_COVERAGE_RADIUS_M`, `frontend/src/lib/osmRoads.js`).
  - **Data pipeline (`scripts/`):** `fetch-graph.mjs` queries the Overpass API for
    pedestrian-accessible OSM ways (excludes motorway/trunk) within that radius, tiling/retrying
    around Overpass's response-size and rate limits; `build-graph.mjs` compiles the result into a
    compact binary graph (`frontend/public/graph/pup-20km.bin`, ~11.6MB for this coverage area) —
    nodes deduped by quantized coordinate, edges carry only a from/to node index and a
    highway-class byte, lengths recomputed at load time. Both scripts are re-runnable (`npm run
    graph:fetch` / `graph:build`) — no hand-carried data file.
  - **Engine (`frontend/rust/router`):** a `wasm-bindgen` crate (+ `serde`/`serde_json` only) —
    loads the binary graph, applies dynamic per-edge cost multipliers from live flagged reports
    (red ×1000 — soft-infinite, avoided unless truly unavoidable; yellow ×5; matches the existing
    `RED_AVOID_RADIUS_M`/`YELLOW_AVOID_RADIUS_M` radii), and runs A* with a haversine heuristic.
    Returns **exactly 2 routes whenever a second path exists at all** — "Recommended" (A* over the
    penalized graph) and "Alternative" (a penalty-method reroute of the recommended path's own
    edges, falling back to relaxing yellow-avoidance, then to whichever candidate merely differs
    from the recommended route by at least one edge if neither attempt is geometrically distinct)
    — or a single route only when the recommended path is the sole way through (a true
    bottleneck). Never 3, down from the prior 1-3 ORS cascade.
  - **Runtime:** `frontend/src/workers/routeWorker.js` (a Web Worker) loads the wasm module and
    the graph asset once, then answers routing requests off the main thread — map panning and
    interaction stay smooth during pathfinding. `frontend/src/lib/routing.js` keeps its existing
    exported contract (`fetchSafeRoutes`, `nearestDistanceToRoute`,
    `RED_AVOID_RADIUS_M`/`YELLOW_AVOID_RADIUS_M`, the `describeStatus` badge vocabulary) so
    `RouteLayer.jsx`/`ZoneMap.jsx` needed only copy changes, not a contract change.
  - **Build artifacts committed:** both `frontend/public/graph/pup-20km.bin` and the wasm-bindgen
    output (`frontend/src/wasm/router/`, `npm run build:wasm`) are committed to the repo — Vercel
    has no Rust toolchain, so these cannot be produced during `vercel build`.
- **Consequences:**
  - The ORS-key-unrestricted open item (Threat T2) is resolved by elimination — there is no
    client-side routing key at all anymore. See `docs/12-security-compliance.md`.
  - Routing has zero external runtime dependency — no quota, no cold start, no outage risk at
    demo time (offline-capable once the graph asset and wasm are cached).
  - New build-time responsibilities: the graph asset must be refreshed (re-run `graph:fetch` +
    `graph:build`) if the underlying OSM data or coverage radius changes, and the wasm package
    must be rebuilt (`build:wasm`) whenever the Rust crate changes — both are manual, committed
    steps, not part of the normal `vercel build`.
  - Route choice is simplified to a fixed "recommended + one alternative" shape everywhere in the
    UI (F-005), superseding the prior variable 1-3-route language in the PRD/QA plan.
  - Supersedes the ORS half of ADR-0001 — MapLibre GL + OpenFreeMap (map **rendering**) is
    unaffected and remains keyless; only the routing half of that decision is replaced here.
    `docs/06-system-design.md` (the stack's canonical owner) is updated in place with a pointer
    back to this ADR, per the same convention ADR-0002 used.
