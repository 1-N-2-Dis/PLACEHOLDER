#!/usr/bin/env node
// Compiles scripts/fetch-graph.mjs's raw OSM ways (scratch/raw-ways.json) into the compact binary
// graph the Rust/WASM router loads at runtime: frontend/public/graph/pup-20km.bin (committed —
// Vercel has no Rust toolchain, so this is a build-time artifact checked into the repo, not
// generated during `vercel build`). Also writes a small sidecar frontend/public/graph/pup-20km.meta.json.
//
// Nodes are deduped by quantized coordinate (1e-5°, ~1.1m) rather than by OSM node id — two ways
// that share a coordinate at that precision are treated as meeting at the same graph node. This
// means every distinct point along every way becomes a node (not just intersections); edges are
// the consecutive-point segments within each way. Edge lengths are NOT stored — the Rust loader
// recomputes them (haversine) from node coordinates.
//
// No dependencies — Node's built-in fs only.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const RAW_PATH = new URL('../scratch/raw-ways.json', import.meta.url);
const OUT_BIN_PATH = new URL('../frontend/public/graph/pup-20km.bin', import.meta.url);
const OUT_META_PATH = new URL('../frontend/public/graph/pup-20km.meta.json', import.meta.url);

const MAGIC = 'SRGF'; // SaferRoute Graph Format
const VERSION = 1;
const QUANTIZE_FACTOR = 1e5; // ~1.1m at this latitude

// Highway-class codes stored per edge (u8). 2 = "major road" for the caution-highway status;
// 0/1 both count as minor for that purpose but 0 (foot-specific) gets a routing preference bonus.
const HIGHWAY_CLASS = {
  footway: 0, path: 0, pedestrian: 0, steps: 0,
  living_street: 1, residential: 1, service: 1, unclassified: 1, tertiary: 1, tertiary_link: 1,
  secondary: 2, secondary_link: 2, primary: 2, primary_link: 2,
};

function quantize(coord) {
  return Math.round(coord * QUANTIZE_FACTOR);
}

async function main() {
  const raw = JSON.parse(await readFile(RAW_PATH, 'utf8'));
  const { ways, bbox, center, radiusMeters } = raw;
  console.log(`Loaded ${ways.length} ways from ${RAW_PATH.pathname}`);

  const nodeIndex = new Map(); // quantized "qlat,qlng" key -> node index
  const nodeLat = [];
  const nodeLng = [];

  function getNodeIndex(lat, lng) {
    const qlat = quantize(lat);
    const qlng = quantize(lng);
    const key = `${qlat},${qlng}`;
    let idx = nodeIndex.get(key);
    if (idx === undefined) {
      idx = nodeLat.length;
      nodeIndex.set(key, idx);
      nodeLat.push(qlat);
      nodeLng.push(qlng);
    }
    return idx;
  }

  const edgeFrom = [];
  const edgeTo = [];
  const edgeClass = [];
  let skippedWays = 0;
  let selfLoopEdges = 0;

  for (const way of ways) {
    const highway = way.tags?.highway;
    const classCode = HIGHWAY_CLASS[highway];
    if (classCode === undefined) { skippedWays++; continue; }

    const geometry = way.geometry ?? [];
    if (geometry.length < 2) { skippedWays++; continue; }

    let prevIdx = getNodeIndex(geometry[0].lat, geometry[0].lon);
    for (let i = 1; i < geometry.length; i++) {
      const idx = getNodeIndex(geometry[i].lat, geometry[i].lon);
      if (idx === prevIdx) { selfLoopEdges++; continue; } // adjacent points quantized to the same node
      edgeFrom.push(prevIdx);
      edgeTo.push(idx);
      edgeClass.push(classCode);
      prevIdx = idx;
    }
  }

  const nodeCount = nodeLat.length;
  const edgeCount = edgeFrom.length;
  console.log(`Compiled ${nodeCount} nodes, ${edgeCount} edges `
    + `(skipped ${skippedWays} unrecognized/degenerate ways, collapsed ${selfLoopEdges} zero-length edges).`);

  if (nodeCount === 0 || edgeCount === 0) {
    throw new Error('Compiled graph is empty — check scratch/raw-ways.json has data before building.');
  }

  // Header: magic(4) + version(1) + nodeCount(4) + edgeCount(4) = 13 bytes.
  const headerSize = 4 + 1 + 4 + 4;
  const nodesSize = nodeCount * 4 * 2; // lat + lng, i32 each
  const edgesSize = edgeCount * (4 + 4 + 1); // from(u32) + to(u32) + class(u8)
  const buf = Buffer.alloc(headerSize + nodesSize + edgesSize);

  let offset = 0;
  buf.write(MAGIC, offset, 'ascii'); offset += 4;
  buf.writeUInt8(VERSION, offset); offset += 1;
  buf.writeUInt32LE(nodeCount, offset); offset += 4;
  buf.writeUInt32LE(edgeCount, offset); offset += 4;

  for (let i = 0; i < nodeCount; i++) { buf.writeInt32LE(nodeLat[i], offset); offset += 4; }
  for (let i = 0; i < nodeCount; i++) { buf.writeInt32LE(nodeLng[i], offset); offset += 4; }
  for (let i = 0; i < edgeCount; i++) { buf.writeUInt32LE(edgeFrom[i], offset); offset += 4; }
  for (let i = 0; i < edgeCount; i++) { buf.writeUInt32LE(edgeTo[i], offset); offset += 4; }
  for (let i = 0; i < edgeCount; i++) { buf.writeUInt8(edgeClass[i], offset); offset += 1; }

  await mkdir(new URL('../frontend/public/graph/', import.meta.url), { recursive: true });
  await writeFile(OUT_BIN_PATH, buf);

  const sizeMb = buf.length / (1024 * 1024);
  console.log(`Wrote ${OUT_BIN_PATH.pathname} (${sizeMb.toFixed(2)} MB)`);
  if (sizeMb > 30) {
    console.warn(`\n*** Graph is ${sizeMb.toFixed(1)} MB, over the ~30MB soft ceiling. ***`
      + '\nShrinking the coverage radius is the lever, but that changes product scope — '
      + 'report this back rather than shrinking it silently.\n');
  }

  const meta = {
    version: VERSION,
    center,
    radiusMeters,
    bbox,
    nodeCount,
    edgeCount,
    sourceWayCount: ways.length,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(OUT_META_PATH, JSON.stringify(meta, null, 2));
  console.log(`Wrote ${OUT_META_PATH.pathname}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
