// Client-side pedestrian routing engine (F-005, ADR-0003) — replaces OpenRouteService. Loads a
// preprocessed graph (binary from scripts/build-graph.mjs, or a GeoJSON fixture for tests), and
// returns exactly 2 severity-tiered routes whenever a second path physically exists: "Recommended"
// (A* over the penalized graph) and "Alternative" (penalty-method reroute of the recommended
// path — preferably distinct, but still returned even if it mostly overlaps the recommended one
// when no more distinct option exists) — see
// docs/06-system-design.md for the full design.

pub mod astar;
pub mod graph;
pub mod penalties;

use graph::{haversine_m, Graph};
use penalties::{Penalties, ReportInput};
use serde::Serialize;
use std::cell::RefCell;
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;


// Below this distance, a projected start/end point is treated as coincident with the adjacent
// path node and isn't duplicated in `coords` — avoids a zero-length spike when a pin lands
// exactly on an intersection (e.g. in tests, or a user tapping a corner).
const ENDPOINT_SNAP_EPSILON_M: f64 = 0.5;

thread_local! {
    static GRAPH: RefCell<Option<Graph>> = RefCell::new(None);
    static PENALTIES: RefCell<Option<Penalties>> = RefCell::new(None);
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RouteOut {
    pub coords: Vec<[f64; 2]>, // [lng, lat], matches the GeoJSON convention used throughout the app
    pub crossed_red: bool,
    pub crossed_yellow: bool,
    pub used_highway: bool,
    pub red_unavoidable: bool,
}

#[derive(Serialize)]
pub struct FindRoutesOut {
    pub routes: Vec<RouteOut>,
}

fn route_from_path(
    graph: &Graph,
    penalties: &Penalties,
    path: &astar::PathResult,
    proj_start: [f64; 2],
    proj_end: [f64; 2],
) -> RouteOut {
    let mut coords: Vec<[f64; 2]> = path
        .node_path
        .iter()
        .map(|&n| [graph.node_lng[n as usize], graph.node_lat[n as usize]])
        .collect();

    // `coords` is [lng, lat]; haversine_m wants (lat, lng), hence the swapped indexing below.
    if let Some(&first) = coords.first() {
        if haversine_m(proj_start[1], proj_start[0], first[1], first[0]) > ENDPOINT_SNAP_EPSILON_M {
            coords.insert(0, proj_start);
        }
    }
    if let Some(&last) = coords.last() {
        if haversine_m(proj_end[1], proj_end[0], last[1], last[0]) > ENDPOINT_SNAP_EPSILON_M {
            coords.push(proj_end);
        }
    }

    let mut crossed_red = false;
    let mut crossed_yellow = false;
    let mut used_highway = false;
    for &edge_idx in &path.edge_path {
        if penalties.red[edge_idx as usize] {
            crossed_red = true;
        }
        if penalties.yellow[edge_idx as usize] {
            crossed_yellow = true;
        }
        if graph.edges[edge_idx as usize].highway_class == 2 {
            used_highway = true;
        }
    }

    RouteOut {
        coords,
        crossed_red,
        crossed_yellow,
        used_highway,
        // The recommended path already routes through a ×1000 penalty on red edges — if it still
        // crosses one, no reasonably-sized detour avoids it, so treat it as unavoidable rather
        // than re-running a second impassable-graph search to confirm.
        red_unavoidable: crossed_red,
    }
}

/// Extends `coords` at each end to the exact raw pin coordinate (which may sit a short distance
/// off the street, e.g. a pin dropped in a driveway or courtyard) — same epsilon-guard as
/// `route_from_path`'s projected-point insertion, so a pin that already coincides with the
/// snapped street point isn't duplicated into a zero-length spike.
fn extend_to_exact_pin(coords: &mut Vec<[f64; 2]>, exact_start: [f64; 2], exact_end: [f64; 2]) {
    if let Some(&first) = coords.first() {
        if haversine_m(exact_start[1], exact_start[0], first[1], first[0]) > ENDPOINT_SNAP_EPSILON_M {
            coords.insert(0, exact_start);
        }
    }
    if let Some(&last) = coords.last() {
        if haversine_m(exact_end[1], exact_end[0], last[1], last[0]) > ENDPOINT_SNAP_EPSILON_M {
            coords.push(exact_end);
        }
    }
}



/// Of an edge's two endpoints, the one closer to (lat, lng) — used to pick an A* routing target
/// from a `nearest_edge` snap, since the search itself still runs node-to-node.
fn closer_endpoint(graph: &Graph, lat: f64, lng: f64, from: u32, to: u32) -> u32 {
    let d_from = haversine_m(lat, lng, graph.node_lat[from as usize], graph.node_lng[from as usize]);
    let d_to = haversine_m(lat, lng, graph.node_lat[to as usize], graph.node_lng[to as usize]);
    if d_from <= d_to {
        from
    } else {
        to
    }
}

/// Core routing logic, independent of the WASM/JSON boundary — exercised directly by unit tests.
pub fn find_routes_internal(
    graph: &Graph,
    penalties: &Penalties,
    start_lat: f64,
    start_lng: f64,
    end_lat: f64,
    end_lng: f64,
) -> Result<FindRoutesOut, String> {
    let (start_proj_lat, start_proj_lng, start_from, start_to) =
        graph.nearest_edge(start_lat, start_lng).ok_or("no graph edge near the start point")?;
    let (end_proj_lat, end_proj_lng, end_from, end_to) =
        graph.nearest_edge(end_lat, end_lng).ok_or("no graph edge near the destination")?;

    let start = closer_endpoint(graph, start_lat, start_lng, start_from, start_to);
    let goal = closer_endpoint(graph, end_lat, end_lng, end_from, end_to);

    let recommended = astar::shortest_path(graph, penalties, None, start, goal)
        .ok_or("no route found between these points")?;

    let proj_start = [start_proj_lng, start_proj_lat];
    let proj_end = [end_proj_lng, end_proj_lat];

    let exact_start = [start_lng, start_lat];
    let exact_end = [end_lng, end_lat];

    let mut routes = vec![route_from_path(graph, penalties, &recommended, proj_start, proj_end)];
    extend_to_exact_pin(&mut routes[0].coords, exact_start, exact_end);

    let zero_penalties = Penalties::none(graph.edges.len());
    let shortest = astar::shortest_path(graph, &zero_penalties, None, start, goal);

    if let Some(alt) = shortest {
        if alt.edge_path != recommended.edge_path {
            let mut alt_route = route_from_path(graph, penalties, &alt, proj_start, proj_end);
            extend_to_exact_pin(&mut alt_route.coords, exact_start, exact_end);
            routes.push(alt_route);
        }
    }

    Ok(FindRoutesOut { routes })
}

#[wasm_bindgen]
pub fn load_graph(bytes: &[u8]) -> Result<(), JsValue> {
    let graph = Graph::from_binary(bytes).map_err(|e| JsValue::from_str(&e))?;
    GRAPH.with(|g| *g.borrow_mut() = Some(graph));
    PENALTIES.with(|p| *p.borrow_mut() = None);
    Ok(())
}

/// Loads a small GeoJSON FeatureCollection instead of the binary format — kept for fixtures /
/// environments that want to swap the data source without touching the engine.
#[wasm_bindgen]
pub fn load_graph_geojson(json: &str) -> Result<(), JsValue> {
    let graph = Graph::from_geojson(json).map_err(|e| JsValue::from_str(&e))?;
    GRAPH.with(|g| *g.borrow_mut() = Some(graph));
    PENALTIES.with(|p| *p.borrow_mut() = None);
    Ok(())
}

#[wasm_bindgen]
pub fn set_penalties(reports_json: &str) -> Result<(), JsValue> {
    let reports: Vec<ReportInput> =
        serde_json::from_str(reports_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    GRAPH.with(|g| {
        let graph_ref = g.borrow();
        let graph = graph_ref.as_ref().ok_or_else(|| JsValue::from_str("graph not loaded"))?;
        let penalties = Penalties::from_reports(graph, &reports);
        PENALTIES.with(|p| *p.borrow_mut() = Some(penalties));
        Ok(())
    })
}

#[wasm_bindgen]
pub fn find_routes(start_lng: f64, start_lat: f64, end_lng: f64, end_lat: f64) -> Result<String, JsValue> {
    GRAPH.with(|g| {
        let graph_ref = g.borrow();
        let graph = graph_ref.as_ref().ok_or_else(|| JsValue::from_str("graph not loaded"))?;

        PENALTIES.with(|p| {
            let pen_ref = p.borrow();
            let owned_none;
            let penalties = match pen_ref.as_ref() {
                Some(existing) => existing,
                None => {
                    owned_none = Penalties::none(graph.edges.len());
                    &owned_none
                }
            };

            let out = find_routes_internal(graph, penalties, start_lat, start_lng, end_lat, end_lng)
                .map_err(|e| JsValue::from_str(&e))?;
            serde_json::to_string(&out).map_err(|e| JsValue::from_str(&e.to_string()))
        })
    })
}
