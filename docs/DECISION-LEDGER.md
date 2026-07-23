# Decision Ledger — GuidHer

> **Purpose:** trunk-owned, append-only record of decisions, pivots, rejected approaches,
> immutable identifiers, and invariant audits. It does not replace the PRD, system design,
> QA plan, or implementation plan. If this ledger and an owning document disagree, reconcile
> the owning document in the same checkpoint.

**Last reconciled:** 2026-07-24

## 1. Names and immutable identifiers

| Name / ID | Kind | Rule |
|---|---|---|
| GuidHer | Public product name | Use on user- and judge-facing surfaces. |
| SaferRoute / SaferRoute Sta. Mesa | Internal codename | Known alias; do not rename blindly. |
| `demo-saferroute` | Immutable Firebase project ID | Never rename; it is deployment configuration. |

## 2. Decision assumptions and evidence

| Supported | Provisional | Unvalidated |
|---|---|---|
| The client-side WASM router is part of this checkout and has no external routing key. | Firebase/Render/Vercel deployment configuration remains usable end to end. | Sufficient report density and a committed institutional payer. |
| Conditions-only reporting and no-rescue copy are encoded as product rules. | Gemini-backed routes are disabled in this checkout through `AI_FEATURES_ENABLED = false`. | Any claimed effect of FMD on build outcomes. |

## 3. Pivots and decisions

### 2026-07-24 — Status-first task-ledger ordering

- **Type:** process / future-framework pivot
- **Change:** reorder the canonical implementation ledger into four scan blocks: Ready/Pending,
  Blocked, Finished, then Deferred. The task schema and status values do not change; the current
  plan uses `ready` for actionable unstarted work because `pending` is not a separate allowed
  status.
- **Why:** the team needs the next actionable work visible before blockers, historical completion,
  or deferred scope when opening the plan.
- **Future framework implementation:** update the FMD implementation-plan template and checker to
  support explicit status sections or a derived status-index view while retaining one canonical
  task table, dependency validation, and DAG-derived waves. Do not create a second editable task
  ledger.
- **Current evidence:** `docs/implementation-plan.md` is reordered and its deterministic checker
  remains the validation authority.

### 2026-07-24 — Dynamic scraping cut for this run

- **Type:** scope
- **Change:** dynamic scraping is excluded from the pilot-readiness run.
- **Revisit only if:** a multi-area scope decision, seed insufficiency, source/licensing review,
  and privacy review are all documented.

### 2026-07-24 — FMD documentation and execution integration

- **Type:** platform
- **Change:** legacy numbered documentation suite → canonical unnumbered documentation, decision
  ledger, implementation plan, and run-evidence protocol.
- **Why:** the tracked framework's execution, verification, and schema mechanisms were not
  integrated into GuidHer’s active documents.
- **Invalidated:** the old generated-provenance claims and repeated document-level verifier model.
- **Recorded as:** [`fmd ADR-0009`](../fmd/adr/ADR-0009-authority-first-keeper-observer-loop.md).
  Its external paired decision is IdeaForge ADR-0005; it is referenced, not vendored here.

### 2026-07-06 — Client-side routing replaces OpenRouteService

- **Type:** platform
- **Change:** OpenRouteService → Rust/WASM A* over a local pedestrian graph.
- **Why:** eliminate routing key, quota, and cold-start dependence.
- **Invalidated:** an ORS client-key restriction as an active risk.
- **Recorded as:** [`ADR-0003`](adr/ADR-0003-client-side-wasm-routing.md).

### 2026-07-02 — Hosting and compute split

- **Type:** platform
- **Change:** Firebase Hosting/Functions → Vercel frontend plus Render Express API; Firebase Auth
  and Firestore remain.
- **Why:** stay compatible with the Spark plan while keeping server-side report writes.
- **Recorded as:** [`ADR-0002`](adr/ADR-0002-hosting-compute-split.md).

## 4. Rejected approaches

| Approach | Rejected because | Revisit only if |
|---|---|---|
| Place-level crime-zone labelling | Breaches conditions-only safety and defamation safeguards. | The product’s core invariants are intentionally changed through a recorded pivot. |
| In-app SOS, rescue, or dispatch promise | GuidHer cannot reliably provide the claimed real-time intervention. A confirmed `tel:911` handoff is distinct and is permitted by BR-002/F-011. | A separately authorized, operational response service exists. |
| External routing API | Adds key, quota, and cold-start risk that the local router removes. | The local graph cannot meet a clearly measured routing requirement. |

## 5. Invariant audit

| Date | INV | Change | Verdict |
|---|---|---|---|
| 2026-07-24 | INV-001..INV-005 | Documentation migration | Pending suite review: retain the conditions-only boundary, the quick-dial boundary, and traceability into PRD, security/design guidance, and QA. |

## 6. Open items

- Run evidence begins with this migration. It cannot establish historical FMD causality.
- GitHub projection is not configured and must remain non-authoritative if activated later.
- Product claims that conflict with code or lack an owning source remain unvalidated until reconciled.
