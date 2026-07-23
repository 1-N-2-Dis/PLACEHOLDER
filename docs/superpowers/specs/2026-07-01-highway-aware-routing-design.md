# Highway-aware, safety-scored routing — design

Status: approved, not yet implemented.

## Problem

The point-to-point route line on the zone map (`frontend/src/features/map/RouteLayer.jsx`) is
broken. It always sends `avoid_features: ['highways']` to OpenRouteService (ORS) on every
request, including the no-avoidance fallback. Confirmed against the live ORS API: `highways` is
not a valid `avoid_features` value for the `foot-walking` profile (ORS error code 2003). Every
route fetch throws, so no route line ever renders today.

Separately, the product goal is: allow routing across major/arterial roads ("yellow roads" in the
OpenFreeMap Liberty style) when there's no alternative, but always prefer and recommend a route
that avoids them when one exists — the same preference already applied to flagged segments.

## Scope

In scope: `RouteLayer.jsx`, the new `frontend/src/lib/routing.js` extraction, `ZoneMap.jsx` badge
rendering, `docs/system-design.md`, `docs/qa-test-plan.md`.

Out of scope: `RouteCheck.jsx` (F-003 pre-trip checklist) — a different feature, unaffected.
Full reconciliation of all doc/code drift (e.g. Google Maps Platform references elsewhere) — only
the routing-relevant parts are touched here.

## Background finding

`ZoneMap.jsx`'s point-to-point router (MapLibre + OpenFreeMap + ORS foot-walking) is not described
anywhere in `docs/prd.md` or `docs/system-design.md` — those docs still describe Google Maps
Platform for routing. This document updates `docs/system-design.md` to describe the real stack
and this new behavior; full PRD reconciliation is a separate, later effort.

## Algorithm

ORS's `foot-walking` profile has no avoid-by-road-class option — only `avoid_polygons` (arbitrary
geometry), the same mechanism already used to avoid flagged segments. The design extends that
mechanism to cover highway-class legs, discovered via ORS's `extra_info: ['waytype']` response
data (`waytype` values: `1` = State Road, `2` = Road — both treated as "highway" for this feature;
`3` = Street, `7` = Footway, etc. are not).

1. **Tier A** — fetch avoiding flagged-segment zones only (as today), with `extra_info: ['waytype']`
   added to the request.
   - If Tier A's request fails outright (e.g. destination sits inside a flagged zone), fall back to
     a plain no-avoidance fetch, also with `extra_info: ['waytype']`. Record `flagsAvoided = false`
     and skip Tier B — adding more constraints on top of an already-infeasible request cannot help.
   - If Tier A succeeds, record `flagsAvoided = true`.
2. Inspect the resulting route's `waytype` extras for any leg with value `1` or `2`.
   - None found → done. Use this route.
   - Found, and `flagsAvoided` is `true` → **Tier B**: re-fetch with `avoid_polygons` covering both
     the flagged zones and buffer-polygons around the highway leg coordinate span(s) (buffering
     technique below).
     - Tier B succeeds → recheck its own `waytype` extras. **(Found during implementation
       testing: avoiding the detected leg can reroute onto a *different* highway-class road
       elsewhere, so success alone doesn't mean `safe`.)** If now highway-free, use it as `safe`.
       If it still has a highway leg, use it as `caution-highway` — flags are still guaranteed
       avoided since `avoid_polygons` is a hard constraint, so only highway status needs rechecking.
     - Tier B fails (no street-level alternative) → keep Tier A's route.
   - Found, and `flagsAvoided` is `false` → no further fetch; use the fallback route as-is.

Worst case is 2 ORS calls — the same ceiling as the current code. Most requests still resolve in 1.

### Buffering a route leg into an avoid-polygon

`RouteLayer.jsx` already buffers a *point* (a flagged segment's lat/lng) into a circular
avoid-polygon (`circleRing`). This adds a sibling helper that buffers a *polyline span* (a run of
route coordinates identified as highway-class by `waytype`) into a polygon: for each consecutive
pair of points in the span, offset perpendicular to the segment direction by a fixed radius
(reuse the existing `circleRing`-style trig, default radius e.g. 20m) to form a quad, and emit one
polygon per pair. These combine with the flagged-segment circles into one `MultiPolygon` for the
`avoid_polygons` option.

## Badge states

Replaces the current `safe` / `caution` / `null` set on `ZoneMap.jsx`:

| State | Meaning |
|---|---|
| `safe` | Avoids both flagged segments and highway legs |
| `caution-flagged` | Passes a flagged segment; no highway leg used |
| `caution-highway` | Uses a highway leg; no flagged segment |
| `caution-both` | Uses a highway leg and passes a flagged segment (no avoidance possible) |
| `null` | No destination set, or the request failed |

`ZoneMap.jsx`'s `.map-ctrl-*` badge rendering gains copy/styling for the two new `caution-*`
variants in place of the single `caution` case. Route line color: green for `safe`, orange for the
three `caution-*` states (matches today's two-color scheme; no new color needed).

## Code structure

`RouteLayer.jsx` currently mixes React component code with routing math (`circleRing`,
`buildAvoidPolygons`, `doFetch`, `fetchSafeRoute`) in one file. This change roughly doubles that
logic (waytype inspection, the new buffering helper, the Tier A/B cascade). Per the existing
project convention (`lib/` = non-UI logic, `features/` = components), extract all non-UI routing
logic into `frontend/src/lib/routing.js`, exporting `fetchSafeRoute(a, b, flaggedGeos)` returning
`{ coords, status }`. `RouteLayer.jsx` becomes a thin effect + render wrapper around it, same
shape as today but calling the extracted function.

## Error handling

Unchanged from today's pattern: ORS failures surface via `onError`, the route line simply doesn't
render, and the badge area shows the error string. Tier A's own-request failure is treated as an
expected branch (the existing fallback path), not an error — only a fully-failed final fetch (both
Tier A and its no-avoidance fallback fail) surfaces an error to the user, matching current
behavior.

## Docs to update

- `docs/system-design.md` — describe the actual stack (MapLibre/OpenFreeMap/ORS, not Google Maps
  Platform, for the map+routing components) and this safety-scored routing behavior.
- `docs/qa-test-plan.md` — add test cases for the four badge states and the Tier A→B fallback
  behavior (e.g. a destination chosen so the only path crosses a known-flagged segment; a
  destination reachable only via a major road).

## Testing approach

Manual verification against the local emulator + live ORS (per `LOCAL_DEV.md` Tier 1/3), picking
origin/destination pairs in the Sta. Mesa zone that exercise each of the four badge states. No
existing automated test harness covers `RouteLayer.jsx`; adding one is not in scope here (matches
current project test coverage, which is `npm run build` + `node --check`, not unit tests on map
components).