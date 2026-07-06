#!/usr/bin/env node
// Fetches OSM pedestrian-accessible ways within ROAD_COVERAGE_RADIUS_M of ZONE_CENTER via the
// Overpass API, for scripts/build-graph.mjs to compile into frontend/public/graph/pup-20km.bin.
// Re-run whenever the underlying OSM data needs refreshing — no hand-carried data file.
//
// A single ~20km-radius query over dense Manila-area OSM data exceeds Overpass's response-size
// and timeout limits, so the bounding box is tiled into quadrants; any tile that fails (or looks
// too large) is split into 4 sub-tiles and retried, down to MAX_SPLIT_DEPTH.
//
// No dependencies — Node's built-in fetch only.

import { writeFile, mkdir } from 'node:fs/promises';
import { ZONE_CENTER } from '../frontend/src/lib/maps.js';
import { ROAD_COVERAGE_RADIUS_M } from '../frontend/src/lib/osmRoads.js';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OUT_PATH = new URL('../scratch/raw-ways.json', import.meta.url);

// Highway tag values pedestrians can use — excludes motorway/trunk (BUILD-GUIDE §6/system design).
const HIGHWAY_CLASSES = [
  'footway', 'path', 'pedestrian', 'steps', 'living_street',
  'residential', 'service', 'unclassified',
  'tertiary', 'tertiary_link', 'secondary', 'secondary_link', 'primary', 'primary_link',
];

const MAX_SPLIT_DEPTH = 4;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 3000;
const RATE_LIMIT_COOLDOWN_MS = 30000; // Overpass's public instance blocks a client for a while after 406/429
const MIN_REQUEST_SPACING_MS = 1500; // enforced between every request, success or failure
const TILE_TIMEOUT_S = 60;

const M_PER_DEG_LAT = 111320;

function metersPerDegLng(lat) {
  return M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

// Square bounding box (south, west, north, east) covering a `radiusMeters` circle around center.
function boundingBox(center, radiusMeters) {
  const latOff = radiusMeters / M_PER_DEG_LAT;
  const lngOff = radiusMeters / metersPerDegLng(center.lat);
  return {
    south: center.lat - latOff,
    north: center.lat + latOff,
    west: center.lng - lngOff,
    east: center.lng + lngOff,
  };
}

function splitBbox({ south, west, north, east }) {
  const midLat = (south + north) / 2;
  const midLng = (west + east) / 2;
  return [
    { south, west, north: midLat, east: midLng },
    { south, west: midLng, north: midLat, east },
    { south: midLat, west, north, east: midLng },
    { south: midLat, west: midLng, north, east },
  ];
}

function overpassQuery({ south, west, north, east }) {
  const filter = `^(${HIGHWAY_CLASSES.join('|')})$`;
  return `[out:json][timeout:${TILE_TIMEOUT_S}];
way["highway"~"${filter}"](${south},${west},${north},${east});
out body geom;`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Overpass's public instance (overpass-api.de) enforces a per-client rate limit — firing
// requests back-to-back (even sequentially, even on failure) can trip it, after which every
// request gets a 406/429 until a cooldown passes. This throttle enforces a minimum spacing
// between every request this script makes, successful or not.
let lastRequestAt = 0;
async function throttle() {
  const wait = lastRequestAt + MIN_REQUEST_SPACING_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

async function fetchTileOnce(bbox) {
  await throttle();
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    // Overpass's Apache front-end 406s requests that look bot-like (missing/generic User-Agent,
    // no Accept header) — Node's default fetch headers trip this. Overpass's usage policy also
    // asks for an identifying User-Agent regardless.
    headers: {
      'Content-Type': 'text/plain',
      Accept: '*/*',
      'User-Agent': 'saferroute-graph-fetch/1.0 (SparkFest GuidHer hackathon build; scripts/fetch-graph.mjs)',
    },
    body: overpassQuery(bbox),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Overpass ${res.status} for tile ${JSON.stringify(bbox)}: ${text.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  return json.elements ?? [];
}

async function fetchTileWithRetry(bbox) {
  let lastErr;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fetchTileOnce(bbox);
    } catch (err) {
      lastErr = err;
      // 400 means the query itself is too heavy for this bbox — retrying won't help, split instead.
      if (err.status === 400) throw err;
      // 406/429 means the client has been rate-limited — back off much longer than a normal retry.
      const delay = err.status === 406 || err.status === 429
        ? RATE_LIMIT_COOLDOWN_MS
        : RETRY_BASE_DELAY_MS * 2 ** attempt;
      console.warn(`  retry ${attempt + 1}/${MAX_RETRIES} after Overpass ${err.status} (waiting ${delay}ms)`);
      await sleep(delay);
    }
  }
  throw lastErr;
}

async function fetchTile(bbox, depth = 0) {
  const label = `[${bbox.south.toFixed(4)},${bbox.west.toFixed(4)},${bbox.north.toFixed(4)},${bbox.east.toFixed(4)}]`;
  console.log(`${'  '.repeat(depth)}querying ${label} (depth ${depth})`);

  try {
    const elements = await fetchTileWithRetry(bbox);
    console.log(`${'  '.repeat(depth)}-> ${elements.length} ways`);
    return elements;
  } catch (err) {
    if (depth >= MAX_SPLIT_DEPTH) {
      console.error(`${'  '.repeat(depth)}giving up on ${label} at max depth: ${err.message}`);
      return [];
    }
    console.warn(`${'  '.repeat(depth)}splitting ${label}: ${err.message}`);
    const quadrants = splitBbox(bbox);
    const results = [];
    for (const quadrant of quadrants) {
      results.push(...await fetchTile(quadrant, depth + 1));
    }
    return results;
  }
}

async function main() {
  if (process.env.HTTPS_PROXY || process.env.https_proxy) {
    console.warn(
      'HTTPS_PROXY is set, but Node\'s built-in fetch does not route through it automatically — '
      + 'if Overpass requests fail to reach the network, run this script from an environment '
      + 'without a proxy requirement.',
    );
  }

  const bbox = boundingBox(ZONE_CENTER, ROAD_COVERAGE_RADIUS_M);
  console.log(`Fetching pedestrian ways within ${ROAD_COVERAGE_RADIUS_M}m of ${JSON.stringify(ZONE_CENTER)}`);
  console.log(`Bounding box: ${JSON.stringify(bbox)}`);

  const elements = await fetchTile(bbox);

  const byId = new Map();
  for (const el of elements) {
    if (el.type !== 'way' || !el.geometry?.length) continue;
    byId.set(el.id, el); // last tile wins; identical way data across overlapping tiles
  }
  const ways = [...byId.values()];

  console.log(`Merged ${elements.length} raw way records into ${ways.length} unique ways.`);

  await mkdir(new URL('../scratch/', import.meta.url), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify({ bbox, center: ZONE_CENTER, radiusMeters: ROAD_COVERAGE_RADIUS_M, ways }));
  console.log(`Wrote ${OUT_PATH.pathname}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
