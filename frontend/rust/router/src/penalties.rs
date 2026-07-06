// Dynamic edge-weight penalties from live flagged reports (F-005 severity tiers — red hard-avoid,
// yellow soft-avoid, green informational-only/never-avoided). See ADR-0003 /
// docs/06-system-design.md for the rationale.

use crate::graph::Graph;
use serde::Deserialize;
use std::collections::HashSet;

// Matches frontend/src/lib/routing.js's RED_AVOID_RADIUS_M / YELLOW_AVOID_RADIUS_M.
pub const RED_AVOID_RADIUS_M: f64 = 90.0;
pub const YELLOW_AVOID_RADIUS_M: f64 = 60.0;

const RED_MULTIPLIER: f64 = 1000.0; // soft-infinite: avoided unless there is truly no alternative
const YELLOW_MULTIPLIER: f64 = 5.0;
const MAJOR_ROAD_MULTIPLIER: f64 = 1.15; // mild — footways preferred only when routes are comparable

#[derive(Deserialize)]
pub struct ReportInput {
    pub lat: f64,
    pub lng: f64,
    pub severity: String, // "red" | "yellow" | "green" — green never enters avoidance
}

pub struct Penalties {
    pub red: Vec<bool>,
    pub yellow: Vec<bool>,
}

impl Penalties {
    pub fn none(edge_count: usize) -> Self {
        Self { red: vec![false; edge_count], yellow: vec![false; edge_count] }
    }

    pub fn from_reports(graph: &Graph, reports: &[ReportInput]) -> Self {
        let mut penalties = Self::none(graph.edges.len());

        for report in reports {
            let (radius, is_red) = match report.severity.as_str() {
                "red" => (RED_AVOID_RADIUS_M, true),
                "yellow" => (YELLOW_AVOID_RADIUS_M, false),
                _ => continue,
            };

            let nearby_nodes = graph.nodes_within(report.lat, report.lng, radius);
            let mut seen_edges = HashSet::new();
            for node in nearby_nodes {
                for &edge_idx in &graph.adjacency[node as usize] {
                    if !seen_edges.insert(edge_idx) {
                        continue;
                    }
                    let edge = &graph.edges[edge_idx as usize];
                    let dist = point_to_segment_m(
                        report.lat, report.lng,
                        graph.node_lat[edge.from as usize], graph.node_lng[edge.from as usize],
                        graph.node_lat[edge.to as usize], graph.node_lng[edge.to as usize],
                    );
                    if dist <= radius {
                        if is_red {
                            penalties.red[edge_idx as usize] = true;
                        } else {
                            penalties.yellow[edge_idx as usize] = true;
                        }
                    }
                }
            }
        }

        penalties
    }

    /// Edge cost multiplier: highway-class base (footways preferred) times any active severity
    /// penalty. Never below 1.0, so a straight-line-distance A* heuristic stays admissible.
    pub fn multiplier(&self, graph: &Graph, edge_idx: u32) -> f64 {
        let edge = &graph.edges[edge_idx as usize];
        let mut m = if edge.highway_class == 0 { 1.0 } else { MAJOR_ROAD_MULTIPLIER };
        if self.red[edge_idx as usize] {
            m *= RED_MULTIPLIER;
        }
        if self.yellow[edge_idx as usize] {
            m *= YELLOW_MULTIPLIER;
        }
        m
    }
}

/// Flat-plane point-to-segment distance in meters — the same approximation style used elsewhere
/// at this zone's scale (frontend/src/lib/routing.js's segmentBufferRing/circleRing).
fn point_to_segment_m(plat: f64, plng: f64, alat: f64, alng: f64, blat: f64, blng: f64) -> f64 {
    let m_per_deg_lat = 111_320.0;
    let m_per_deg_lng = m_per_deg_lat * alat.to_radians().cos();

    let bx = (blng - alng) * m_per_deg_lng;
    let by = (blat - alat) * m_per_deg_lat;
    let px = (plng - alng) * m_per_deg_lng;
    let py = (plat - alat) * m_per_deg_lat;

    let len_sq = bx * bx + by * by;
    let t = if len_sq == 0.0 { 0.0 } else { ((px * bx + py * by) / len_sq).clamp(0.0, 1.0) };
    let proj_x = bx * t;
    let proj_y = by * t;
    ((px - proj_x).powi(2) + (py - proj_y).powi(2)).sqrt()
}
