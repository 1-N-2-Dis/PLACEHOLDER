// One-off: imports backend/data/crime-reports.csv and backend/data/safe/safe-areas.csv into
// their Supabase tables (crime_reports_csv, safe_areas_csv — see backend/supabase/schema.sql).
// Re-runnable: clears each table before inserting, so reruns don't duplicate rows.
//
// Run: node backend/scripts/import-csv-to-supabase.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
// See backend/server/lib/supabase.js for why: supabase-js needs a WebSocket global (Node 22+)
// just to construct its client, even for scripts that never open a Realtime channel.
import WebSocket from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.loadEnvFile?.(path.join(__dirname, '..', 'server', '.env'));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/server/.env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: WebSocket },
});

function loadCsv(relativePath) {
  const raw = readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

async function importCrimeReports() {
  const rows = loadCsv('data/crime-reports.csv');
  const mapped = rows.map((r) => ({
    location: r.location,
    crime_report: r['crime reports'],
    crime_type: r['type of crime'],
    date_of_occurrence: r['date of occurrence'],
    source: r.source,
  }));

  const { error: delErr } = await supabase.from('crime_reports_csv').delete().gte('id', 0);
  if (delErr) throw new Error(`Clearing crime_reports_csv failed: ${delErr.message}`);

  const { error: insErr } = await supabase.from('crime_reports_csv').insert(mapped);
  if (insErr) throw new Error(`Inserting crime_reports_csv failed: ${insErr.message}`);

  console.log(`✓ crime_reports_csv: ${mapped.length} rows imported (data/crime-reports.csv).`);
}

async function importSafeAreas() {
  // backend/data/safe/ and backend/data/safe-spaces/ hold byte-identical duplicate CSVs —
  // safe/ is treated as canonical here.
  const rows = loadCsv('data/safe/safe-areas.csv');
  const mapped = rows.map((r) => ({
    location: r.location,
    landmark_name: r.landmark_name,
    safety_type: r.safety_type,
    operating_hours: r.operating_hours,
    is_24_7: r.is_24_7?.trim().toLowerCase() === 'yes',
    last_verified: r.last_verified,
  }));

  const { error: delErr } = await supabase.from('safe_areas_csv').delete().gte('id', 0);
  if (delErr) throw new Error(`Clearing safe_areas_csv failed: ${delErr.message}`);

  const { error: insErr } = await supabase.from('safe_areas_csv').insert(mapped);
  if (insErr) throw new Error(`Inserting safe_areas_csv failed: ${insErr.message}`);

  console.log(`✓ safe_areas_csv: ${mapped.length} rows imported (data/safe/safe-areas.csv).`);
}

async function main() {
  await importCrimeReports();
  await importSafeAreas();
  console.log('\nCSV import complete.');
}

main().catch((err) => {
  console.error('\nCSV import failed:', err.message);
  process.exit(1);
});
