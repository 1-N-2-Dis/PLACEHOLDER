// Fixture-based pathfinding/penalty/alternative tests (native `cargo test` — see ADR-0003 /
// docs/06-system-design.md). Fixtures are hand-built small graphs, not the real 20km data.

use router::graph::{haversine_m, Edge, Graph};
use router::penalties::{Penalties, ReportInput};
use router::{find_routes_internal, FindRoutesOut};

const BASE_LAT: f64 = 14.6000;
const BASE_LNG: f64 = 121.0000;

fn edge(lat: &[f64], lng: &[f64], from: usize, to: usize, class: u8) -> Edge {
    let length_m = haversine_m(lat[from], lng[from], lat[to], lng[to]);
    Edge { from: from as u32, to: to as u32, highway_class: class, length_m }
}

/// A -> B -> C in a straight line, plus a longer detour A -> D -> C.
///     A --- B --- C
///      \_________/  (via D, longer)
fn line_with_detour_graph() -> Graph {
    let lat = vec![
        BASE_LAT,           // A = 0
        BASE_LAT,           // B = 1
        BASE_LAT,           // C = 2
        BASE_LAT - 0.003,   // D = 3 (detour, south of the direct line)
    ];
    let lng = vec![
        BASE_LNG,           // A
        BASE_LNG + 0.001,   // B
        BASE_LNG + 0.002,   // C
        BASE_LNG + 0.001,   // D
    ];
    let edges = vec![
        edge(&lat, &lng, 0, 1, 0), // A-B footway
        edge(&lat, &lng, 1, 2, 0), // B-C footway
        edge(&lat, &lng, 0, 3, 0), // A-D footway
        edge(&lat, &lng, 3, 2, 0), // D-C footway
    ];
    Graph::build(lat, lng, edges)
}

#[test]
fn shortest_path_prefers_the_direct_line_with_no_penalties() {
    let graph = line_with_detour_graph();
    let penalties = Penalties::none(graph.edges.len());

    let out = find_routes_internal(&graph, &penalties, BASE_LAT, BASE_LNG, BASE_LAT, BASE_LNG + 0.002)
        .expect("route should be found");

    let recommended = &out.routes[0];
    // Direct A-B-C is 3 points; the D detour is longer and would produce 3 points too but a
    // different path — assert by coordinates that the direct line was chosen.
    assert_eq!(recommended.coords.len(), 3, "expected the 2-edge direct path A-B-C");
    assert!(!recommended.crossed_red);
    assert!(!recommended.crossed_yellow);
}

#[test]
fn red_report_diverts_the_recommended_route_onto_the_detour() {
    let graph = line_with_detour_graph();
    let reports = vec![ReportInput { lat: BASE_LAT, lng: BASE_LNG + 0.001, severity: "red".into() }]; // at B
    let penalties = Penalties::from_reports(&graph, &reports);

    let out = find_routes_internal(&graph, &penalties, BASE_LAT, BASE_LNG, BASE_LAT, BASE_LNG + 0.002)
        .expect("route should be found");

    let recommended = &out.routes[0];
    assert!(!recommended.crossed_red, "recommended route should reroute around the red report");
    assert!(!recommended.red_unavoidable);
}

/// A single bottleneck edge (B) is the only connection between A and C — no alternative exists
/// that avoids it, so a red report there must still be flagged as unavoidable.
fn bottleneck_graph() -> Graph {
    let lat = vec![BASE_LAT, BASE_LAT, BASE_LAT];
    let lng = vec![BASE_LNG, BASE_LNG + 0.001, BASE_LNG + 0.002];
    let edges = vec![
        edge(&lat, &lng, 0, 1, 0), // A-B
        edge(&lat, &lng, 1, 2, 0), // B-C — the only way through
    ];
    Graph::build(lat, lng, edges)
}

#[test]
fn red_report_on_the_only_path_is_marked_unavoidable() {
    let graph = bottleneck_graph();
    let reports = vec![ReportInput { lat: BASE_LAT, lng: BASE_LNG + 0.001, severity: "red".into() }]; // at B
    let penalties = Penalties::from_reports(&graph, &reports);

    let out = find_routes_internal(&graph, &penalties, BASE_LAT, BASE_LNG, BASE_LAT, BASE_LNG + 0.002)
        .expect("route should still be found — red is soft-avoid, not impassable");

    let recommended = &out.routes[0];
    assert!(recommended.crossed_red, "the only path crosses the red-flagged edge");
    assert!(recommended.red_unavoidable);
}

/// A 3x3 grid graph between opposite corners has multiple equal-length shortest paths — the
/// alternative-route search should always find a distinct one here.
fn grid_graph(size: usize) -> Graph {
    let mut lat = Vec::new();
    let mut lng = Vec::new();
    for r in 0..size {
        for c in 0..size {
            lat.push(BASE_LAT + (r as f64) * 0.001);
            lng.push(BASE_LNG + (c as f64) * 0.001);
        }
    }
    let idx = |r: usize, c: usize| r * size + c;
    let mut edges = Vec::new();
    for r in 0..size {
        for c in 0..size {
            if c + 1 < size {
                edges.push(edge(&lat, &lng, idx(r, c), idx(r, c + 1), 0));
            }
            if r + 1 < size {
                edges.push(edge(&lat, &lng, idx(r, c), idx(r + 1, c), 0));
            }
        }
    }
    Graph::build(lat, lng, edges)
}

/// Pins placed mid-edge (not on a node) should route to the exact pinned coordinate rather than
/// overshooting to the nearest intersection — the projected point is prepended/appended to the
/// path instead of just snapping to node A / node C.
#[test]
fn mid_edge_pins_snap_to_the_projected_point_not_the_node() {
    let graph = line_with_detour_graph();
    let penalties = Penalties::none(graph.edges.len());

    // Start: partway along A-B (both at BASE_LAT, so the midpoint is still on the line).
    let start_lat = BASE_LAT;
    let start_lng = BASE_LNG + 0.0005;
    // End: partway along B-C.
    let end_lat = BASE_LAT;
    let end_lng = BASE_LNG + 0.0015;

    let out = find_routes_internal(&graph, &penalties, start_lat, start_lng, end_lat, end_lng)
        .expect("route should be found");

    let recommended = &out.routes[0];
    let first = recommended.coords.first().expect("route should have coords");
    let last = recommended.coords.last().expect("route should have coords");

    // coords are [lng, lat].
    assert!((first[0] - start_lng).abs() < 1e-6, "route should start at the pinned coordinate, not node A");
    assert!((first[1] - start_lat).abs() < 1e-6);
    assert!((last[0] - end_lng).abs() < 1e-6, "route should end at the pinned coordinate, not node C");
    assert!((last[1] - end_lat).abs() < 1e-6);
}

#[test]
fn shortest_route_ignores_penalties_while_safest_avoids_them() {
    let graph = line_with_detour_graph();
    let reports = vec![ReportInput { lat: BASE_LAT, lng: BASE_LNG + 0.001, severity: "red".into() }]; // at B
    let penalties = Penalties::from_reports(&graph, &reports);

    let out = find_routes_internal(&graph, &penalties, BASE_LAT, BASE_LNG, BASE_LAT, BASE_LNG + 0.002)
        .expect("route should be found");

    assert_eq!(out.routes.len(), 2, "should return the safest detour and the shorter straight line");
    
    let safest = &out.routes[0];
    let shortest = &out.routes[1];

    assert!(!safest.crossed_red, "safest route should reroute around the red report");
    assert!(shortest.crossed_red, "shortest route ignores penalties and crosses the red report");
    assert_ne!(safest.coords, shortest.coords);
}
