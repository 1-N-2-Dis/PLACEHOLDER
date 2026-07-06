// Binary-heap A* over the weighted pedestrian graph, haversine-distance heuristic. Bounded to the
// coverage area (<=20km), so a full A* explores comfortably within a frame budget in WASM —
// bidirectional A*/contraction hierarchies would be overkill at this scale (see ADR-0003).

use crate::graph::{haversine_m, Graph};
use crate::penalties::Penalties;
use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap};

pub struct PathResult {
    pub node_path: Vec<u32>,
    pub edge_path: Vec<u32>,
}

#[derive(Clone, Copy)]
struct HeapItem {
    f: f64,
    node: u32,
}
impl PartialEq for HeapItem {
    fn eq(&self, other: &Self) -> bool {
        self.f == other.f
    }
}
impl Eq for HeapItem {}
impl PartialOrd for HeapItem {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}
impl Ord for HeapItem {
    // Reversed so BinaryHeap (a max-heap) pops the smallest f-score first.
    fn cmp(&self, other: &Self) -> Ordering {
        other.f.partial_cmp(&self.f).unwrap_or(Ordering::Equal)
    }
}

fn heuristic(graph: &Graph, from: u32, to: u32) -> f64 {
    haversine_m(
        graph.node_lat[from as usize], graph.node_lng[from as usize],
        graph.node_lat[to as usize], graph.node_lng[to as usize],
    )
}

/// A* shortest path from `start` to `goal`. `extra_penalty` layers additional per-edge cost
/// multipliers on top of `penalties` (used by the alternative-route penalty method) — `None`
/// means no extra layer. Returns `None` if `goal` is unreachable from `start`.
pub fn shortest_path(
    graph: &Graph,
    penalties: &Penalties,
    extra_penalty: Option<&HashMap<u32, f64>>,
    start: u32,
    goal: u32,
) -> Option<PathResult> {
    let n = graph.node_lat.len();
    let mut g_score = vec![f64::INFINITY; n];
    let mut came_from: Vec<Option<(u32, u32)>> = vec![None; n]; // (prev_node, via_edge)
    let mut visited = vec![false; n];

    g_score[start as usize] = 0.0;
    let mut heap = BinaryHeap::new();
    heap.push(HeapItem { f: heuristic(graph, start, goal), node: start });

    while let Some(HeapItem { node, .. }) = heap.pop() {
        if visited[node as usize] {
            continue;
        }
        visited[node as usize] = true;
        if node == goal {
            break;
        }

        for &edge_idx in &graph.adjacency[node as usize] {
            let edge = &graph.edges[edge_idx as usize];
            let other = if edge.from == node { edge.to } else { edge.from };
            if visited[other as usize] {
                continue;
            }

            let mut mult = penalties.multiplier(graph, edge_idx);
            if let Some(extra) = extra_penalty {
                if let Some(&p) = extra.get(&edge_idx) {
                    mult *= p;
                }
            }
            let tentative = g_score[node as usize] + edge.length_m * mult;

            if tentative < g_score[other as usize] {
                g_score[other as usize] = tentative;
                came_from[other as usize] = Some((node, edge_idx));
                heap.push(HeapItem { f: tentative + heuristic(graph, other, goal), node: other });
            }
        }
    }

    if g_score[goal as usize].is_infinite() {
        return None;
    }

    let mut node_path = vec![goal];
    let mut edge_path = Vec::new();
    let mut current = goal;
    while current != start {
        let (prev, edge_idx) = came_from[current as usize]?;
        edge_path.push(edge_idx);
        node_path.push(prev);
        current = prev;
    }
    node_path.reverse();
    edge_path.reverse();

    Some(PathResult { node_path, edge_path })
}
