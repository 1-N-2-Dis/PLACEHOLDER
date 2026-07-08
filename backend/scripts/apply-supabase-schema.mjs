// One-off: applies backend/supabase/schema.sql to the live Supabase Postgres database.
// Uses a direct Postgres connection (not the Supabase JS client) since DDL isn't exposed via
// the REST/data API. Reads connection details from backend/server/.env (SUPABASE_URL +
// SUPABASE_DB_PASSWORD) so the DB password never has to be typed on the command line.
//
// Run: node backend/scripts/apply-supabase-schema.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// backend/server/.env holds the real Supabase credentials (git-ignored); backend/.env would
// also work if present, but the credentials currently live alongside the Express app.
process.loadEnvFile?.(path.join(__dirname, '..', 'server', '.env'));

const SUPABASE_URL = process.env.SUPABASE_URL;
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD;
if (!SUPABASE_URL || !DB_PASSWORD) {
  console.error('Missing SUPABASE_URL or SUPABASE_DB_PASSWORD in backend/server/.env');
  process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
const schemaSql = readFileSync(path.join(__dirname, '..', 'supabase', 'schema.sql'), 'utf8');

// Supabase's direct connection (db.<ref>.supabase.co:5432) is IPv6-only on most projects; the
// Supavisor session pooler gives an IPv4-reachable equivalent on the same port. Try direct first
// and fall back to the pooler host on connection failure.
const candidates = [
  { host: `db.${projectRef}.supabase.co`, port: 5432, label: 'direct' },
  { host: `aws-0-ap-southeast-1.pooler.supabase.com`, port: 5432, label: 'pooler (ap-southeast-1, session)' },
];

async function tryConnect({ host, port, label }) {
  const client = new pg.Client({
    host,
    port,
    user: label.startsWith('pooler') ? `postgres.${projectRef}` : 'postgres',
    password: DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  await client.connect();
  console.log(`Connected via ${label} (${host}:${port}).`);
  return client;
}

async function main() {
  // Explicit override — set DATABASE_URL to the exact string from Supabase's "Connect" dialog
  // if the guessed hosts below don't match your project's region/pooler setup.
  if (process.env.DATABASE_URL) {
    const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await client.connect();
    console.log('Connected via DATABASE_URL override.');
    try {
      await client.query(schemaSql);
      console.log('\n✓ Schema applied: reports, crime_reports_csv, safe_areas_csv, barangay_analytics_cache, platform_transparency_stats.');
    } finally {
      await client.end();
    }
    return;
  }

  let client;
  let lastErr;
  for (const candidate of candidates) {
    try {
      client = await tryConnect(candidate);
      break;
    } catch (err) {
      lastErr = err;
      console.warn(`  ${candidate.label} failed: ${err.message}`);
    }
  }
  if (!client) {
    console.error('\nCould not connect to Supabase Postgres via any known host.');
    console.error('Open your Supabase project -> Connect -> copy the exact connection string and re-run with it, e.g.:');
    console.error('  DATABASE_URL="postgres://..." node backend/scripts/apply-supabase-schema.mjs');
    throw lastErr;
  }

  try {
    await client.query(schemaSql);
    console.log('\n✓ Schema applied: reports, crime_reports_csv, safe_areas_csv, barangay_analytics_cache, platform_transparency_stats.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('\nSchema apply failed:', err.message);
  process.exit(1);
});
