# Implementation Plan — GuidHer pilot readiness

> This is the single `TASK-###` execution-state home. Markdown is canonical; GitHub is an optional
> outbound mirror. Abu is product lead and Build Keeper, and is the sole status writer.

**Plan steward:** Abu / Build Keeper
**Last checkpoint:** 2026-07-24 — TASK-005 completed: private GuidHer Delivery Project created and
verified with its FMD task projection; product implementation remains unstarted.
**Current stopping point:** docs/FMD planning checkpoint plus GitHub projection; no product code,
deployment, outreach, senior feedback, or pilot activity is claimed.

PR policy: blocked downstream tasks do not prevent a scoped PR. PR readiness is evaluated separately
from pilot/release readiness using intentional diff scope, targeted validation, review, and mergeability.

## 1. Planning inputs

- **Team:** Abu—product lead/Build Keeper; Helena—design, branding, partner/pilot coordination;
  Jim—full-stack; Farhana—DevOps/data, verification, and privacy.
- **Pilot boundary:** adults 18+, explicit consent, isolated non-production smoke path before any
  pilot, PUP Sta. Mesa commute zone only.
- **Map language:** temporary red/yellow **condition heatmap**, never a danger zone, crime map, or
  place rating.
- **Quality commands:** `npm test --prefix backend/server` · `npm run build --prefix frontend` ·
  `python3 fmd/tools/check-implementation-plan.py docs/implementation-plan.md` ·
  `python3 -m py_compile fmd/tools/*.py` · `git diff --check`.

## 2. Task ledger

The ledger is intentionally separated for human scanning: **Ready / Pending → Blocked → Finished →
Deferred**. There are no separate `pending` status values in the current schema; unstarted work that
is actionable remains `ready`. Dependencies, status values, and evidence remain canonical in the rows.

### Ready / Pending

| ID | Outcome / trace | Depends on | Owner | Write scope | Work ref | Status | Gate / evidence |
|---|---|---|---|---|---|---|---|
| TASK-006 | Restore F-006 `valid`/`spam`/`mismatch`/`crime_label`; remove random fallback; environment-controlled fail-closed moderation | — | Jim | `backend/server/**` | not started | ready | `npm test --prefix backend/server` must prove spam, mismatch, and crime-label inputs reject without writes; missing/invalid AI configuration must fail closed for pilot reporting |
| TASK-008 | Source-backed privacy/verification memo with senior feedback, pilot risks, and minimum controls; docs | — | Farhana | `docs/privacy-verification-memo.md` | not started | ready | `test -f docs/privacy-verification-memo.md` after memo cites official DPA/NPC sources, captures senior feedback, identifies pilot risks, and remains non-legal-advice |
| TASK-011 | Request Blockchain4Her pilot access and maintain a private consented contact map; docs/process | — | Helena | private coordination record only | not started | ready | `test -f PRIVATE_PARTNER_ACCESS_RECORD` in approved private storage; no contact data in repo/Issues and no partnership claim until confirmed |
| TASK-012 | Form 3–4 falsifiable business-model hypotheses beyond B2G; docs/test | — | Abu | product discovery record | not started | ready | `test -f docs/analysis/business-model-hypotheses.md`; each entry needs buyer, budget source, evidence, and disconfirming signal |

### Blocked

| ID | Outcome / trace | Depends on | Owner | Write scope | Work ref | Status | Gate / evidence |
|---|---|---|---|---|---|---|---|
| TASK-007 | Provision isolated non-production Render/Supabase path and controlled live-model smoke test; infra with Render-only Gemini secret | TASK-006 | Farhana | environment configuration; `docs/ops.md` | not started | blocked | `curl --fail https://REPLACE_TEST_HOST/health` plus authenticated smoke and secret scan; blocked until TASK-006 review |
| TASK-009 | Implement approved pilot privacy controls and verified-reporter rule; F-002/F-009/INV-001 | TASK-008 | Jim; Farhana review | report API/schema, Profile privacy control, notice, security/data docs | not started | blocked | `npm test --prefix backend/server` plus browser/API inspection must prove reporter identifiers and raw sensitive content are not publicly exposed; privacy notice, retention/deletion handling, and verified-reporter rule need Abu approval |
| TASK-010 | Implement/test F-010 condition-heatmap threshold using only fresh AI-valid reports from distinct verified pilot accounts | TASK-007, TASK-009 | Jim | report projection, heatmap, methods/QA docs | not started | blocked | `npm test --prefix backend/server` must prove only qualifying fresh reports contribute; heatmap language stays conditions-only; routing and pins still work |
| TASK-013 | Run consented 18+ pilot after technical/privacy/partner gates pass; test with de-identified findings | TASK-007, TASK-009, TASK-010, TASK-011 | Abu; Helena support | consented field records; `docs/run-evidence.jsonl` | not started | blocked | `python3 fmd/tools/record-run-event.py --help` before evidence capture; blocked on written access, consent, moderated backend, privacy, rollback, stop condition |

### Finished

| ID | Outcome / trace | Depends on | Owner | Write scope | Work ref | Status | Gate / evidence |
|---|---|---|---|---|---|---|---|
| TASK-001 | Root seed and framework intake; F-001..F-011, INV-001..INV-005 | — | Historical / unassigned | `idea.md`, `context.md`, `fmd/` | `docs/fmd-guidher-integration` | done | `python3 -m py_compile fmd/tools/*.py` · result: PASS · artifact: tracked framework kit |
| TASK-002 | Canonical document paths and owner map; docs | TASK-001 | Historical / unassigned | `docs/index.md`, canonical docs | `docs/fmd-guidher-integration` | done | `git diff --check` · result: PASS · artifact: canonical owner map |
| TASK-003 | Execution, run-evidence, operations, and projection boundaries; docs | TASK-002 | Historical / unassigned | planning/operations docs | `docs/fmd-guidher-integration` | done | `python3 fmd/tools/check-implementation-plan.py docs/implementation-plan.md` · result: PASS at prior checkpoint · artifact: EVT-001 |
| TASK-004 | Product/claims and architecture/traceability reviews; test | TASK-003 | Historical / unassigned | docs and validation | `docs/fmd-guidher-integration` | done | `npm run build --prefix frontend` · result: PASS at prior checkpoint · artifact: two-suite review |
| TASK-005 | Create a private repo-linked GuidHer Delivery Project; docs/infra preview before SHA-bound apply | TASK-004 | Abu / Build Keeper | `docs/implementation-plan.md`, `fmd/tools/sync-github-project.py` | [GuidHer Delivery Project](https://github.com/orgs/1-N-2-Dis/projects/1) | done | GitHub API verified private, exclusively linked to `1-N-2-Dis/GuidHer`, with 14 task items and all implementation fields · artifact: https://github.com/orgs/1-N-2-Dis/projects/1 · EVT-003 |

### Deferred

| ID | Outcome / trace | Depends on | Owner | Write scope | Work ref | Status | Gate / evidence |
|---|---|---|---|---|---|---|---|
| TASK-014 | Keep dynamic scraping out of this run; docs/infra cut | — | Abu | plan/decision ledger | local checkout | cut | `rg -n "dynamic scraping" docs/implementation-plan.md docs/DECISION-LEDGER.md` · artifact: cut/reopen conditions recorded |

## 3. GitHub delivery projection

**Run ID:** `RUN-20260724-guidher-pilot-readiness`

**GitHub delivery mode:** `active`

**Last GitHub preview SHA-256:** `3d20c1d532cc832bcf8136f94948782bd15a49746480651220f444094051880e`

The private [**GuidHer Delivery** Project](https://github.com/orgs/1-N-2-Dis/projects/1) is
exclusively linked to the GuidHer repository. It projects historical TASK-001..004 and current
TASK-005..014 with `Task ID`, `Run ID`, `Plan Status`, and `Wave` fields. The field rename preview
produced the SHA above; apply and GitHub API verification are recorded in `EVT-004`. The
synchronizer owns only marker-backed Issue blocks; human titles, discussion,
comments, labels, assignees, PR activity, and unrelated fields remain human-owned.

## 4. Release and evidence gates

- Firebase emulators prove authentication behavior only; they do not prove Supabase or Gemini.
- TASK-007 uses isolated test data and never logs/commits a key or places one in GitHub.
- Public browser/API inspection must show no reporter UID, raw `liked_by`, note, or photo path.
- A single valid verified report remains a pin. Three distinct verified accounts are required for
  the same fresh segment/condition before it enters the heatmap.
- Pilot launch requires written partner access, adult consent, working backend, active moderation,
  approved privacy controls, rollback steps, and a named stop condition. Any pilot-safety failure
  pauses the pilot; GitHub sync failure never blocks coding.
- Build Keeper records real checkpoints in append-only `docs/run-evidence.jsonl` from inspected
  test/deployment/pilot evidence, not chat or card movement.

## 5. Derived execution view

- **Ready now:** TASK-006, TASK-008, TASK-011, TASK-012.
- **Blocked:** TASK-007, TASK-009, TASK-010, and TASK-013 until their dependency/live gates pass.
- **Done:** TASK-001 through TASK-005.
- **Cut:** TASK-014 dynamic scraping.

## 6. Change log

| Event | Tasks affected | Evidence | Canonical docs reconciled |
|---|---|---|---|
| 2026-07-24 status-first ledger ordering pivot | TASK-005..TASK-014 | Ready/Pending → Blocked → Finished → Deferred ordering; checker remains authoritative | decision ledger, future-framework note |
| 2026-07-24 pilot-readiness plan update | TASK-005..TASK-014 | Documentation-only task plan; product implementation explicitly not claimed | context, implementation plan, decision ledger |
| 2026-07-24 GitHub projection preview | TASK-005 | `python3 fmd/tools/sync-github-project.py --plan docs/implementation-plan.md --run-id RUN-20260724-guidher-pilot-readiness --repo 1-N-2-Dis/GuidHer --project-owner 1-N-2-Dis --create-project-title "GuidHer Delivery"` · result: PREVIEW ONLY · SHA `c74a447e87cdf8a9052461004d0df7e482fba053487f1a48e338a14b99bb7c30` | implementation plan |
| 2026-07-24 GitHub projection applied and verified | TASK-005 | private Project #1 exclusively linked to `1-N-2-Dis/GuidHer`; 14 task items and all implementation fields verified · artifact: EVT-003 | implementation plan, run evidence |
| 2026-07-24 Project field naming pivot | TASK-005 | `FMD Task`/`FMD Run`/`FMD Status`/`FMD Wave` renamed in place to `Task ID`/`Run ID`/`Plan Status`/`Wave`; 14 items retained · artifact: EVT-004 · applied SHA `3d20c1d532cc832bcf8136f94948782bd15a49746480651220f444094051880e` | implementation plan, FMD projection ADRs, run evidence |
