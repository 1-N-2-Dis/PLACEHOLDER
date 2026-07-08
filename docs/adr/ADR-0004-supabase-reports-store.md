## ADR-0004 — Reports + analytics data move to Supabase (Postgres); Firestore keeps Auth/users

- **Date:** 2026-07-08
- **Status:** Accepted
- **Context:** Firestore's `reports`, `barangay_analytics_cache`, and `platform_transparency_stats`
  collections held all crowd-submitted safety reports and the compiled analytics/transparency
  data. The team wants to bring in the raw source CSVs (`backend/data/crime-reports.csv`,
  `backend/data/safe/safe-areas.csv`) as queryable reference tables rather than leaving them as
  static files, and wants report/analytics data in a relational store (Supabase/Postgres)
  alongside that reference data — while keeping user identity and role assignment
  (`users/{uid}.role`, used by `isAdmin`) on Firebase, since that's the surface the Google-tech
  requirement is anchored to (see AGENTS.md, ADR-0002).
- **Options considered:**
  1. **Move everything (reports + analytics + users + Auth) to Supabase.** One database instead
     of two. Rejected: would drop Firestore/Firebase Auth entirely, and the Google-technology
     requirement (AGENTS.md) is satisfied by **Firestore + Auth + Gemini** — removing Firestore
     and Auth both would need Gemini alone to carry that requirement, a bigger, riskier change
     than this task called for.
  2. **Leave reports/analytics on Firestore, add Supabase only for the two reference CSVs.**
     Smallest change, but the CSVs would sit disconnected from the live reports data they
     describe, and doesn't match the ask (reports should live in Supabase too).
  3. **Split by domain: Auth + `users` (role/identity) stay on Firebase; `reports`,
     `barangay_analytics_cache`, `platform_transparency_stats`, and the two reference CSVs
     (`crime_reports_csv`, `safe_areas_csv`) move to Supabase (Postgres).** Two data stores, but
     each owns a coherent domain (identity vs. report/analytics data), and Firestore's role in
     the Google-tech requirement (Auth + `users`) is untouched.
- **Decision:** Option 3.
  - **Schema:** `backend/supabase/schema.sql` — `reports`, `crime_reports_csv`, `safe_areas_csv`,
    `barangay_analytics_cache`, `platform_transparency_stats`. Applied via
    `backend/scripts/apply-supabase-schema.mjs` (direct Postgres connection using the project's
    DB password — a one-off migration script, not used by the running app).
  - **Row Level Security:** every table allows public `SELECT`; no table has an `INSERT`/
    `UPDATE`/`DELETE` policy for the `anon`/`authenticated` roles. The backend's `service_role`
    key (which bypasses RLS entirely) is the only writer — the same "server is the only writer"
    shape `backend/firestore.rules` enforced for `reports` before this change.
  - **Auth boundary, and why client-side admin delete had to move server-side:** Supabase RLS
    evaluates Supabase's own Auth JWTs; it has no way to see a Firebase ID token or evaluate
    Firebase's `isAdmin()` rule. Because Auth intentionally stayed on Firebase (this ADR, option
    3), there is no RLS policy that could ever authorize a client-held anon key to write —
    including the admin moderation delete, which the pre-Supabase Firestore Rules allowed
    directly from an authenticated admin client (`allow delete: if isAdmin()`). That delete now
    routes through `backend/server`'s existing `isAdmin`-guarded
    `DELETE /api/v1/admin/reports/:id` route instead of a direct database call from
    `frontend/src/lib/reports.js` — see that file's `deleteReport()`.
  - **Reads:** the frontend reads `reports` directly via the Supabase JS client (anon key) and
    subscribes to Postgres Changes (`supabase.channel(...).on('postgres_changes', ...)`) in place
    of Firestore's `onSnapshot` — see `frontend/src/lib/supabase.js` and `reports.js`.
  - **Backend:** `backend/server/index.js` uses `backend/server/lib/supabase.js` (service_role
    client) for every `reports`/`barangay_analytics_cache`/`platform_transparency_stats`
    read/write; `firebase-admin/firestore` is retained solely for the `users/{uid}.role` lookup
    in the `isAdmin` middleware. Two atomic Postgres functions
    (`increment_report_corroboration`, `toggle_report_like`) replace Firestore's
    `FieldValue.increment`/`arrayUnion`/`arrayRemove`; `delete_report_and_decrement` replaces the
    Firestore transaction that deleted a report and decremented the transparency total together.
  - **CSV import:** `backend/scripts/import-csv-to-supabase.mjs` loads `crime-reports.csv` into
    `crime_reports_csv` and `backend/data/safe/safe-areas.csv` into `safe_areas_csv` (the
    byte-identical `safe-spaces/` copy is untouched — `safe/` is treated as canonical). Both CSVs
    remain reference/analytics data — nothing in the app reads them at request time; they are not
    the same rows as `reports`.
- **Consequences:**
  - Two data stores instead of one for report-adjacent data (Firestore for identity, Supabase for
    reports/analytics) — cross-referencing a report's `uid` against a Firestore `users` doc still
    requires two separate reads, same as before this change (the backend already did this: reports
    lived in Firestore, `users` also in Firestore, but as separate collections with no enforced
    referential integrity).
  - Client-side admin delete moved from a direct Firestore call (gated by Firestore Rules'
    `isAdmin()`) to a backend API call (gated by the same `isAdmin` check, now enforced in
    `backend/server` instead of database rules) — functionally equivalent, one more network hop.
  - The Google-technology requirement (Firebase + Gemini) is unaffected: Firestore still hosts
    Auth-adjacent data (`users`) and Firebase Auth issues every ID token this app trusts.
  - Supabase has no local emulator wired into this project's dev stack (unlike Firestore/Auth,
    which run against `docker-compose.yml`'s `emulators` service) — local dev and production both
    talk to the same hosted Supabase project.
