-- SaferRoute Supabase (Postgres) schema.
-- Role: stores report data (crowd-submitted + CSV-seeded) and derived analytics/transparency
-- stats. Firebase Auth + the Firestore `users` collection stay as the identity/role source of
-- truth — this schema has no `users` table; `uid` columns below hold a Firebase uid as a plain
-- text foreign-key-by-convention (no cross-database FK enforcement).
--
-- RLS mirrors backend/firestore.rules: public read on every table, no direct client
-- insert/update/delete policies. The backend's service_role key bypasses RLS entirely (that's
-- how Supabase's service_role works), so it stays the only writer — same shape as the Admin SDK
-- being the only writer to Firestore today.
--
-- Apply with: node backend/scripts/apply-supabase-schema.mjs (see that script for how to connect).

create extension if not exists pgcrypto; -- gen_random_uuid()

-- ─────────────────────────────────────────────────────────────────────────────
-- reports — crowd-submitted safety reports + CSV-seeded baseline reports.
-- Mirrors the Firestore `reports` collection shape (docs/09-data-model.md).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  segment_id text not null,
  condition_type text not null check (condition_type in ('poor_lighting', 'no_crowd', 'recent_incident')),
  severity text check (severity in ('green', 'yellow', 'red')),
  title text not null,
  note text,
  photo_path text,
  uid text not null,
  corroboration_count integer not null default 1,
  liked_by text[] not null default '{}',
  verdict text,
  location text,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

-- Mirrors backend/firestore.indexes.json's (segmentId ASC, createdAt DESC) composite index —
-- same query shape as submitReport's dedup lookup / assessRoute's per-segment latest-report read.
create index if not exists reports_segment_id_created_at_idx
  on reports (segment_id, created_at desc);

alter table reports enable row level security;
drop policy if exists "reports_public_read" on reports;
create policy "reports_public_read" on reports for select using (true);
-- No insert/update/delete policy: only the service_role key (used exclusively by
-- backend/server/index.js) can write, since service_role bypasses RLS entirely.

-- Atomic corroboration increment — replaces Firestore's FieldValue.increment(1) for the
-- duplicate-report path in POST /submitReport.
create or replace function increment_report_corroboration(p_report_id uuid)
returns table (id uuid, corroboration_count integer) as $$
  update reports
  set corroboration_count = corroboration_count + 1,
      last_activity_at = now()
  where reports.id = p_report_id
  returning reports.id, reports.corroboration_count;
$$ language sql volatile;

-- Idempotent like/unlike toggle — replaces Firestore's arrayUnion/arrayRemove for POST /likeReport.
create or replace function toggle_report_like(p_report_id uuid, p_uid text, p_liked boolean)
returns table (id uuid, liked_by text[]) as $$
  update reports
  set liked_by = case
    when p_liked then (select array_agg(distinct e) from unnest(liked_by || array[p_uid]) as e)
    else array_remove(liked_by, p_uid)
  end
  where reports.id = p_report_id
  returning reports.id, reports.liked_by;
$$ language sql volatile;

-- Realtime: lets the frontend subscribe to report inserts/deletes directly (anon key + RLS),
-- replacing Firestore's onSnapshot (see frontend/src/lib/reports.js).
alter publication supabase_realtime add table reports;

-- ─────────────────────────────────────────────────────────────────────────────
-- crime_reports_csv — raw import of backend/data/crime-reports.csv (reference/analytics data,
-- not written to at runtime by the app).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists crime_reports_csv (
  id serial primary key,
  location text not null,
  crime_report text,
  crime_type text,
  date_of_occurrence text,
  source text
);

alter table crime_reports_csv enable row level security;
drop policy if exists "crime_reports_csv_public_read" on crime_reports_csv;
create policy "crime_reports_csv_public_read" on crime_reports_csv for select using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- safe_areas_csv — raw import of backend/data/safe/safe-areas.csv (reference/analytics data,
-- not written to at runtime by the app).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists safe_areas_csv (
  id serial primary key,
  location text not null,
  landmark_name text,
  safety_type text,
  operating_hours text,
  is_24_7 boolean,
  last_verified text
);

alter table safe_areas_csv enable row level security;
drop policy if exists "safe_areas_csv_public_read" on safe_areas_csv;
create policy "safe_areas_csv_public_read" on safe_areas_csv for select using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- barangay_analytics_cache — pre-compiled per-zone metrics + Gemini-generated mitigations.
-- Written only by backend/scripts/compile-analytics.mjs / POST /api/v1/admin/compile-analytics.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists barangay_analytics_cache (
  location_id text primary key,
  location text not null,
  last_updated timestamptz not null default now(),
  metrics jsonb not null default '{}'::jsonb,
  ai_analysis jsonb not null default '{}'::jsonb
);

alter table barangay_analytics_cache enable row level security;
drop policy if exists "barangay_analytics_cache_public_read" on barangay_analytics_cache;
create policy "barangay_analytics_cache_public_read" on barangay_analytics_cache for select using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- platform_transparency_stats — single-row aggregate counters (mirrors the Firestore
-- `platform_transparency_stats/global` document).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists platform_transparency_stats (
  id text primary key default 'global',
  total_community_reports_processed integer not null default 0,
  ai_moderation_rejections_spam integer not null default 0,
  duplicate_corroborations_merged integer not null default 0,
  generated_barangay_briefs_count integer not null default 0,
  last_processed_timestamp timestamptz
);

alter table platform_transparency_stats enable row level security;
drop policy if exists "platform_transparency_stats_public_read" on platform_transparency_stats;
create policy "platform_transparency_stats_public_read" on platform_transparency_stats for select using (true);

-- Atomic delete + decrement for DELETE /api/v1/admin/reports/:id — replaces the Firestore
-- transaction that deleted the report doc and decremented total_community_reports_processed
-- together. Returns true if a row was actually deleted (false = already gone / race).
create or replace function delete_report_and_decrement(p_report_id uuid)
returns boolean as $$
declare
  v_count integer;
begin
  delete from reports where id = p_report_id;
  get diagnostics v_count = row_count;
  if v_count > 0 then
    insert into platform_transparency_stats (id, total_community_reports_processed)
    values ('global', -1)
    on conflict (id) do update
      set total_community_reports_processed = platform_transparency_stats.total_community_reports_processed - 1;
    return true;
  end if;
  return false;
end;
$$ language plpgsql volatile;
