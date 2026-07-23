# GuidHer documentation index

This index is the document-set manifest for the current checkout. Markdown is canonical. One
fact has one owner; other documents link to the owner rather than restating it.

## 0. Source-of-truth map

| Concern | Canonical owner | Notes |
|---|---|---|
| Build context, constraints, and selected conditional documents | [Context](../context.md) | Intake input; not a product-spec owner. |
| Problem, segment, feature IDs, and hard boundaries | [Idea](../idea.md) | Root seed; `F-###` and `INV-###` originate here. |
| Product behavior, user journeys, business rules, acceptance criteria | [PRD](prd.md) | `F-###`, `UJ-###`, and `BR-###` contract. |
| Components, deployment topology, data-store split | [System Design](system-design.md) | Map/routing and Supabase/Firebase architecture owner. |
| Entities, data contracts, RLS, and retention surfaces | [Data Model](data-model.md) | Supabase report data and Firestore role-record owner. |
| Routing, freshness, and derived calculations | [Methods](methods.md) | Code-grounded equation and input registry. |
| Feature/invariant test traceability | [QA Test Plan](qa-test-plan.md) | Every active `F-###` and `INV-###` resolves here. |
| Auth, authorization, secrets, privacy, and safety threats | [Security & Compliance](security-compliance.md) | Every network surface has an auth/authz owner. |
| UI tokens, components, and prohibited copy | [Design System](design-system.md) | Enforces product language boundaries. |
| Decisions, pivots, names, and invariant audits | [Decision Ledger](DECISION-LEDGER.md) | Append-only decision history; does not override an owner. |
| Current execution state and GitHub projection state | [Implementation Plan](implementation-plan.md) | `TASK-###` only; Markdown remains canonical. |
| Observed build events | [Run evidence](run-evidence.jsonl) | Append-only facts, not a decision source. |
| Operations, deployment, and recovery boundaries | [Operations](ops.md) | Current verified operational facts. |
| Release/adoption work | [Release / GTM](release-gtm.md) | Selected because the project outlives the demo. |
| Judged-build narrative and Q&A | [Pitch Kit](pitch-kit.md) | Consumes the context-owned rubric. |
| Completed-run learning and framework proposals | [Postmortem](postmortem.md) | Active only after `run_closed`. |
| Significant technical choices | [ADRs](adr/) | Pair each material decision with the ledger. |

## 1. Selected document suite

The core planning set remains: PRD, system design, data model, methods, QA, and security. The
conditional set is selected by [context.md](../context.md): implementation plan, decision ledger,
change record, onboarding, operations, release/GTM, pitch kit, run evidence, and postmortem.

Historical or supporting material remains available but is not a second canonical owner:

- [Hackathon context](00-hackathon-context.md), [BRD](01-brd.md), [MRD](02-mrd.md), evidence
  registers, design explorations, and the `docs/superpowers/` history are reference material.
- [SparkFest change log](archive/2026-sparkfest-change-log.md) is an archive, not current
  product authority.
- [Build Guide](BUILD-GUIDE.md), [Deployment Guide](DEPLOYMENT_GUIDE.md), [Local Dev](LOCAL_DEV.md),
  and [deploy quick reference](deploy.md) are historical SparkFest procedures. They are not current
  architecture or execution authority; use [Operations](ops.md), System Design, and the plan.

## 2. Verification model

1. Run deterministic structure, link/ID, parsing, and focused product checks.
2. Review the product/claims cluster: seed, PRD, release, pitch, and external-facing copy.
3. Review the architecture/traceability cluster: system design, data model, methods, security,
   QA, and implementation plan.
4. Repair only the affected cluster. Retry that suite once; after two failed repair cycles,
   escalate the unresolved decision to the product lead.

The Humanizer is not a default review pass. Use it only for explicitly requested external prose,
after factual review succeeds.

## 3. Reconciliation triggers

Reconcile when a task changes status, a decision is accepted, implementation reveals a material
dependency or failed assumption, the team/time/scope changes, or a session/milestone ends. Inspect
evidence first, update the canonical owner only if its fact changed, update the task ledger, and
run the relevant checks. Do not manufacture historical outcomes or causality.
