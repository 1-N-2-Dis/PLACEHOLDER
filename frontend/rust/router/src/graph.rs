// Graph storage + loading (binary format from scripts/build-graph.mjs, or a GeoJSON fixture for
// tests/small demos — see ADR-0003 / docs/06-system-design.md). Nodes are deduped by
// quantized coordinate (1e-5 degrees, ~1.1m) rather than by OSM node id: every distinct point
// along every way is a graph node, and two ways sharing a coordinate at that precision are
// treated as meeting at the same node. Edge lengths are not stored on disk — they're recomputed
// here (haversine) from node coordinates.

use serde::Deserialize;
use std::collections::{HashMap, HashSet};

const MAGIC: &[u8; 4] = b"SRGF";
const SUPPORTED_VERSION: u8 = 1;
const QUANTIZE_FACTOR: f64 = 1e5;

// Coarse grid cell size for nearest-node / radius lookups — large enough that a 90m penalty
// query only has to inspect a small neighborhood of cells, small enough to keep per-cell node
// counts low in dense urban areas.
const CELL_SIZE_DEG: f64 = 0.002; // ~220m at this latitude

pub struct Edge {
    pub from: u32,
    pub to: u32,
    pub highway_class: u8, // 0 = footway/path/pedestrian/steps, 1 = minor road, 2 = major road
    pub length_m: f64,
}

pub struct Graph {
    pub node_lat: Vec<f64>,
    pub node_lng: Vec<f64>,
    pub edges: Vec<Edge>,
    pub adjacency: Vec<Vec<u32>>, // node index -> incident edge indices
    grid: HashMap<(i32, i32), Vec<u32>>,
}

pub fn haversine_m(lat1: f64, lng1: f64, lat2: f64, lng2: f64) -> f64 {
    const EARTH_RADIUS_M: f64 = 6_371_000.0;
    let phi1 = lat1.to_radians();
    let phi2 = lat2.to_radians();
    let d_phi = (lat2 - lat1).to_radians();
    let d_lambda = (lng2 - lng1).to_radians();
    let a = (d_phi / 2.0).sin().powi(2) + phi1.cos() * phi2.cos() * (d_lambda / 2.0).sin().powi(2);
    2.0 * EARTH_RADIUS_M * a.sqrt().clamp(-1.0, 1.0).asin()
}

/// Projects `(lat, lng)` onto the line segment `(from_lat, from_lng)`-`(to_lat, to_lng)`,
/// returning the closest point on the segment (clamped to the endpoints) and the distance from
/// the query point to that projection, in meters. Uses a local equirectangular (flat-earth)
/// approximation centered on the segment's mean latitude rather than an iterative haversine
/// projection — accurate to sub-meter error over the short edges typical of a street graph, and
/// cheap enough to run for every candidate edge during a `nearest_edge` search.
pub fn project_point_to_segment(
    lat: f64,
    lng: f64,
    from_lat: f64,
    from_lng: f64,
    to_lat: f64,
    to_lng: f64,
) -> (f64, f64, f64) {
    const METERS_PER_DEG_LAT: f64 = 111_320.0;
    let ref_lat_rad = ((from_lat + to_lat) / 2.0).to_radians();
    let meters_per_deg_lng = METERS_PER_DEG_LAT * ref_lat_rad.cos();

    // Local xy plane in meters, origin at `from`.
    let to_xy = |lt: f64, lg: f64| ((lg - from_lng) * meters_per_deg_lng, (lt - from_lat) * METERS_PER_DEG_LAT);
    let (bx, by) = to_xy(to_lat, to_lng);
    let (px, py) = to_xy(lat, lng);

    let len_sq = bx * bx + by * by;
    let t = if len_sq > 0.0 { ((px * bx + py * by) / len_sq).clamp(0.0, 1.0) } else { 0.0 };

    let proj_x = t * bx;
    let proj_y = t * by;
    let proj_lat = from_lat + proj_y / METERS_PER_DEG_LAT;
    let proj_lng = from_lng + proj_x / meters_per_deg_lng;
    let dist_m = ((px - proj_x).powi(2) + (py - proj_y).powi(2)).sqrt();

    (proj_lat, proj_lng, dist_m)
}

/// Highway tag -> class code. `None` means the way is not pedestrian-relevant and should be
/// skipped (mirrors scripts/build-graph.mjs's HIGHWAY_CLASS table).
pub fn highway_class(highway: &str) -> Option<u8> {
    match highway {
        "footway" | "path" | "pedestrian" | "steps" => Some(0),
        "living_street" | "residential" | "service" | "unclassified" | "tertiary" | "tertiary_link" => Some(1),
        "secondary" | "secondary_link" | "primary" | "primary_link" => Some(2),
        _ => None,
    }
}

fn intern_node(
    lat: f64,
    lng: f64,
    node_index: &mut HashMap<(i64, i64), u32>,
    node_lat: &mut Vec<f64>,
    node_lng: &mut Vec<f64>,
) -> u32 {
    let key = ((lat * QUANTIZE_FACTOR).round() as i64, (lng * QUANTIZE_FACTOR).round() as i64);
    if let Some(&idx) = node_index.get(&key) {
        return idx;
    }
    let idx = node_lat.len() as u32;
    node_index.insert(key, idx);
    node_lat.push(lat);
    node_lng.push(lng);
    idx
}

#[derive(Deserialize)]
struct GeoJsonRoot {
    features: Vec<GeoJsonFeature>,
}
#[derive(Deserialize)]
struct GeoJsonFeature {
    properties: GeoJsonProps,
    geometry: GeoJsonGeometry,
}
#[derive(Deserialize)]
struct GeoJsonProps {
    highway: String,
}
#[derive(Deserialize)]
struct GeoJsonGeometry {
    coordinates: Vec<[f64; 2]>, // [lng, lat]
}

impl Graph {
    /// Loads the compact binary graph format written by scripts/build-graph.mjs.
    pub fn from_binary(bytes: &[u8]) -> Result<Self, String> {
        if bytes.len() < 13 || &bytes[0..4] != MAGIC {
            return Err("invalid graph file: bad magic bytes".into());
        }
        let version = bytes[4];
        if version != SUPPORTED_VERSION {
            return Err(format!("unsupported graph version {version}"));
        }
        let node_count = u32::from_le_bytes(bytes[5..9].try_into().unwrap()) as usize;
        let edge_count = u32::from_le_bytes(bytes[9..13].try_into().unwrap()) as usize;

        let expected_len = 13 + node_count * 8 + edge_count * 9;
        if bytes.len() < expected_len {
            return Err(format!(
                "truncated graph file: expected at least {expected_len} bytes, got {}",
                bytes.len()
            ));
        }

        let read_i32 = |o: usize| i32::from_le_bytes(bytes[o..o + 4].try_into().unwrap());
        let read_u32 = |o: usize| u32::from_le_bytes(bytes[o..o + 4].try_into().unwrap());

        let mut offset = 13usize;
        let mut node_lat = Vec::with_capacity(node_count);
        for i in 0..node_count {
            node_lat.push(read_i32(offset + i * 4) as f64 / QUANTIZE_FACTOR);
        }
        offset += node_count * 4;

        let mut node_lng = Vec::with_capacity(node_count);
        for i in 0..node_count {
            node_lng.push(read_i32(offset + i * 4) as f64 / QUANTIZE_FACTOR);
        }
        offset += node_count * 4;

        let mut edge_from = Vec::with_capacity(edge_count);
        for i in 0..edge_count {
            edge_from.push(read_u32(offset + i * 4));
        }
        offset += edge_count * 4;

        let mut edge_to = Vec::with_capacity(edge_count);
        for i in 0..edge_count {
            edge_to.push(read_u32(offset + i * 4));
        }
        offset += edge_count * 4;

        let mut edges = Vec::with_capacity(edge_count);
        for i in 0..edge_count {
            let from = edge_from[i];
            let to = edge_to[i];
            let length_m = haversine_m(
                node_lat[from as usize], node_lng[from as usize],
                node_lat[to as usize], node_lng[to as usize],
            );
            edges.push(Edge { from, to, highway_class: bytes[offset + i], length_m });
        }

        Ok(Self::build(node_lat, node_lng, edges))
    }

    /// Loads a small GeoJSON FeatureCollection of LineStrings (each with a `highway` tag
    /// property) — used for unit tests and small fixtures, keeping the engine data-format-
    /// agnostic rather than hard-wired to the binary format.
    pub fn from_geojson(json: &str) -> Result<Self, String> {
        let root: GeoJsonRoot = serde_json::from_str(json).map_err(|e| e.to_string())?;

        let mut node_index: HashMap<(i64, i64), u32> = HashMap::new();
        let mut node_lat = Vec::new();
        let mut node_lng = Vec::new();
        let mut edges = Vec::new();

        for feature in &root.features {
            let Some(class) = highway_class(&feature.properties.highway) else { continue };
            let coords = &feature.geometry.coordinates;
            if coords.len() < 2 {
                continue;
            }
            let mut prev = intern_node(coords[0][1], coords[0][0], &mut node_index, &mut node_lat, &mut node_lng);
            for pt in &coords[1..] {
                let idx = intern_node(pt[1], pt[0], &mut node_index, &mut node_lat, &mut node_lng);
                if idx == prev {
                    continue;
                }
                let length_m = haversine_m(
                    node_lat[prev as usize], node_lng[prev as usize],
                    node_lat[idx as usize], node_lng[idx as usize],
                );
                edges.push(Edge { from: prev, to: idx, highway_class: class, length_m });
                prev = idx;
            }
        }

        Ok(Self::build(node_lat, node_lng, edges))
    }

    pub fn build(node_lat: Vec<f64>, node_lng: Vec<f64>, edges: Vec<Edge>) -> Self {
        let mut adjacency = vec![Vec::new(); node_lat.len()];
        for (i, edge) in edges.iter().enumerate() {
            adjacency[edge.from as usize].push(i as u32);
            adjacency[edge.to as usize].push(i as u32);
        }

        let mut grid: HashMap<(i32, i32), Vec<u32>> = HashMap::new();
        for (i, (&lat, &lng)) in node_lat.iter().zip(node_lng.iter()).enumerate() {
            grid.entry(Self::cell_of(lat, lng)).or_default().push(i as u32);
        }

        Self { node_lat, node_lng, edges, adjacency, grid }
    }

    fn cell_of(lat: f64, lng: f64) -> (i32, i32) {
        ((lat / CELL_SIZE_DEG).floor() as i32, (lng / CELL_SIZE_DEG).floor() as i32)
    }

    /// Nearest graph node to (lat, lng), by expanding grid-cell rings outward. Approximate: once
    /// a ring yields any candidates, only one further ring is scanned before settling — fine for
    /// snapping a route endpoint (not for exact-nearest-neighbor queries).
    pub fn nearest_node(&self, lat: f64, lng: f64) -> Option<u32> {
        let (cy, cx) = Self::cell_of(lat, lng);
        let mut best: Option<(u32, f64)> = None;
        let mut first_hit_radius: Option<i32> = None;

        for radius in 0..64 {
            if let Some(hit) = first_hit_radius {
                if radius > hit + 1 {
                    break;
                }
            }
            let mut found_any = false;
            for dy in -radius..=radius {
                for dx in -radius..=radius {
                    if radius > 0 && dy.abs() != radius && dx.abs() != radius {
                        continue;
                    }
                    if let Some(nodes) = self.grid.get(&(cy + dy, cx + dx)) {
                        found_any = true;
                        for &n in nodes {
                            let d = haversine_m(lat, lng, self.node_lat[n as usize], self.node_lng[n as usize]);
                            if best.map_or(true, |(_, bd)| d < bd) {
                                best = Some((n, d));
                            }
                        }
                    }
                }
            }
            if found_any && first_hit_radius.is_none() {
                first_hit_radius = Some(radius);
            }
        }
        best.map(|(n, _)| n)
    }

    /// Nearest graph edge to (lat, lng), by expanding grid-cell rings outward over nodes (same
    /// approximate ring-expansion strategy as `nearest_node`) and checking every edge incident to
    /// a node found in-range. Returns the projected point on that edge along with the edge's
    /// `(from, to)` node indices, so a caller can snap a route endpoint onto the street itself
    /// rather than overshooting to the nearest intersection.
    pub fn nearest_edge(&self, lat: f64, lng: f64) -> Option<(f64, f64, u32, u32)> {
        let (cy, cx) = Self::cell_of(lat, lng);
        let mut best: Option<(f64, f64, u32, u32, f64)> = None; // proj_lat, proj_lng, from, to, dist
        let mut seen_edges: HashSet<u32> = HashSet::new();
        let mut first_hit_radius: Option<i32> = None;

        for radius in 0..64 {
            if let Some(hit) = first_hit_radius {
                if radius > hit + 1 {
                    break;
                }
            }
            let mut found_any = false;
            for dy in -radius..=radius {
                for dx in -radius..=radius {
                    if radius > 0 && dy.abs() != radius && dx.abs() != radius {
                        continue;
                    }
                    if let Some(nodes) = self.grid.get(&(cy + dy, cx + dx)) {
                        found_any = true;
                        for &n in nodes {
                            for &edge_idx in &self.adjacency[n as usize] {
                                if !seen_edges.insert(edge_idx) {
                                    continue;
                                }
                                let edge = &self.edges[edge_idx as usize];
                                let (proj_lat, proj_lng, dist) = project_point_to_segment(
                                    lat,
                                    lng,
                                    self.node_lat[edge.from as usize],
                                    self.node_lng[edge.from as usize],
                                    self.node_lat[edge.to as usize],
                                    self.node_lng[edge.to as usize],
                                );
                                if best.map_or(true, |b| dist < b.4) {
                                    best = Some((proj_lat, proj_lng, edge.from, edge.to, dist));
                                }
                            }
                        }
                    }
                }
            }
            if found_any && first_hit_radius.is_none() {
                first_hit_radius = Some(radius);
            }
        }
        best.map(|(proj_lat, proj_lng, from, to, _)| (proj_lat, proj_lng, from, to))
    }

    /// Node indices within `radius_m` of (lat, lng).
    pub fn nodes_within(&self, lat: f64, lng: f64, radius_m: f64) -> Vec<u32> {
        let cell_radius = ((radius_m / 111_320.0) / CELL_SIZE_DEG).ceil() as i32 + 1;
        let (cy, cx) = Self::cell_of(lat, lng);
        let mut out = Vec::new();
        for dy in -cell_radius..=cell_radius {
            for dx in -cell_radius..=cell_radius {
                if let Some(nodes) = self.grid.get(&(cy + dy, cx + dx)) {
                    for &n in nodes {
                        let d = haversine_m(lat, lng, self.node_lat[n as usize], self.node_lng[n as usize]);
                        if d <= radius_m {
                            out.push(n);
                        }
                    }
                }
            }
        }
        out
    }
}
