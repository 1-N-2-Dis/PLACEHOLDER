# GuidHer — Product and documentation guide

GuidHer (internal codename: SaferRoute Sta. Mesa) is a conditions-only, pre-trip commuting
guide for women and LGBTQ+ riders in the PUP Sta. Mesa zone. The public product name is
**GuidHer**. `demo-saferroute` is an immutable Firebase project identifier; do not rename it.

Start with [the documentation index](docs/index.md), then [the root seed](../idea.md) and
[context input](context.md). They are the current documentation entry points.

## Product boundaries

- Reports describe observable conditions only: `poor_lighting`, `no_crowd`, or
  `recent_incident`. Never create a crime-zone, neighborhood, or people label.
- Severity (`green`, `yellow`, `red`) is AI-assigned for a single report; it is never a
  neighborhood or place rating.
- The active coverage area is the PUP Sta. Mesa commute zone. Do not expand it without a
  recorded product decision.
- GuidHer makes no in-app rescue, dispatch, tracking, or intervention promise. F-011 may hand
  the user to the device's native `tel:911` dialer only through its confirmation flow; it must
  never imply that GuidHer responds.
- Gemini may classify or summarize supplied reports. It must not invent incidents, conditions,
  route facts, or user-facing emergency claims.

## Current architecture

- React/Vite frontend on Vercel; MapLibre GL with OpenFreeMap renders the map without a client
  key.
- Client-side Rust/WASM routing runs in a Web Worker over the checked-in pedestrian graph. It has
  no external routing key, provider quota, or provider fallback.
- Firebase Auth issues the user token. Firestore holds `users/{uid}.role` for identity and
  authorization only.
- Supabase/Postgres owns `reports`, analytics caches, and imported reference tables. Browser
  access is read-only under RLS; `backend/server` is the only report writer with the Supabase
  service-role credential.
- `submitReport` and `assessRoute` run in the Express API. Keep Gemini, Firebase Admin, and
  Supabase service-role credentials server-side.
- Photo upload remains disabled by `PHOTO_UPLOAD_ENABLED = false`. Do not re-enable it casually.

See [System Design](docs/system-design.md), [Data Model](docs/data-model.md), and
[ADR-0004](docs/adr/ADR-0004-supabase-reports-store.md) for owned details.

## Documentation and execution rules

- A fact has one canonical owner. Read [docs/index.md](docs/index.md) before editing a product
  document; update the owner, then reconcile only the affected references.
- The core planning set is the PRD, system design, data model, methods, QA plan, and security
  document. Conditional documents exist only because [context.md](context.md) records an actual
  need; do not generate extra documents merely because a template exists.
- [docs/implementation-plan.md](docs/implementation-plan.md) is the canonical `TASK-###` state.
  Owners remain `UNASSIGNED` until the product lead assigns them. The Build Keeper is the sole
  task-status writer and records only inspected branch, test, integration, or review evidence.
- [docs/run-evidence.jsonl](docs/run-evidence.jsonl) is append-only and fact-only. Unknown time,
  causality, or feedback stays `unknown`.
- Significant decisions require an ADR when appropriate and a matching
  [Decision Ledger](docs/DECISION-LEDGER.md) entry. A possible invariant change requires an
  invariant audit before it is accepted.
- Framework Observer proposals belong in [docs/postmortem.md](docs/postmortem.md) after a
  `run_closed` event. Framework agents must not autonomously edit `fmd/` templates or playbooks.

## Verification and GitHub projection

Run deterministic checks and the narrowest relevant product checks first. Then run exactly two
fresh-context reviews: one product/claims review and one architecture/traceability review. Repair
only the affected cluster. Use a Humanizer only when external prose is explicitly requested and
facts have already been reviewed.

Markdown is canonical. GitHub Issues and Projects are optional outbound projections only:

- First sync is preview-only.
- Apply needs the plan's GitHub delivery mode set to `active`, a lead-reviewed manifest SHA, and
  that exact SHA supplied to the synchronizer.
- The sync may update only its marker-backed content. Existing titles, discussion, comments,
  labels, assignees, PR activity, and unrelated fields remain human-owned.
- GitHub may not create or rewrite a canonical task. A sync failure suspends the projection only;
  coding and local verification continue.

Before claiming a tracked documentation checkpoint, run at least:

```sh
python3 fmd/tools/check-implementation-plan.py docs/implementation-plan.md
python3 -m py_compile fmd/tools/*.py
git diff --check
```

Run the relevant frontend, backend, and Rust checks for any behavior change. Do not deploy,
publish, send external messages, or modify production data without explicit authorization.

## Fable activation

Fable Mode activates only when the user explicitly names Fable Mode or directly requests a Fable
model. Task size, ambiguity, failures, or a request to “think deeply” do not activate it.
