# FMD — Foundational Matrix Documents

The **factory**. It turns an `idea.md` into a context-sized `/docs` set selected from one versioned
template library. It does **not** author the idea, and it does **not** validate it — FMD generates
docs from whatever the brief contains and trusts that any problem/market validation happened
upstream (if it happened at all). For tracked builds, its emitted living plan remains the execution
contract; the external coding layer still writes, reviews, and merges code.

## Standalone by design (idea-kit is optional)

```
  OPTIONAL upstream (any author)             FACTORY (this repo)
  ──────────────────────────────            ───────────────────
  hand-written · reverse-engineered          →   FMD   →   /docs + agent files
  from code · one-sitting hackathon draft        (select → generate → QA)   (checkpoint during build)
  · or the idea-kit (if you want validation)
                              │                       │
                          idea.md ────────────────────┘
```

- **FMD (this repo):** consumes any `idea.md` matching the input section schema and generates the
  docs. It runs a **structural preflight** (does the brief have the sections the first docs
  read?) — **not** a validation firewall. The preflight never refuses to run.
- **Authoring the brief is out of scope.** Write `idea.md` however you like. For a 3-hour
  hackathon, draft it in one sitting — FMD does not require interviews, evidence, or a "frozen"
  status, and it never stamps a doc "incomplete" for lacking them.
- **The idea-kit is one optional upstream** for when you *do* want problem/market validation. It
  is not part of FMD and FMD does not run it. See `manifest.json` → `forge`.

**Why keep them separate but decoupled?** FMD still grounds every claim in `idea.md` (or the
codebase) and never free-associates — that's what keeps it honest. But *whether the idea is worth
building* is a different question FMD deliberately doesn't ask. Decision recorded in
`adr/ADR-0002`.

## How to use it in a real project

```bash
# Author an idea.md however you like (one sitting is fine), then:
git submodule add <fmd-repo-url> fmd     # or copy / template the repo
# Point your agent at the factory's brain:
#    "Read fmd/agents/ORCHESTRATOR.md and run the factory on ./idea.md"
```

The orchestrator runs the structural preflight, then generates `/docs` (MVP set first) and the
target project's `AGENTS.md` + tool pointers. A build that selects `implementation-plan` needs
`python3` for the stdlib T6 checker. Its optional GitHub delivery projection additionally needs the
authenticated `gh` CLI with the `project` scope; builds that do not configure GitHub add no runtime
dependency.

## Start here

**`agents/ORCHESTRATOR.md`** — the operating brain. Any agent running the factory reads it first.

## What lives where

| Path             | What it is |
|------------------|------------|
| `VERSION`        | FMD kit semver; significant behavior changes are recorded in `adr/`. |
| `manifest.json`  | The **build graph**: each doc's `mvp` / `dependsOn` / `producedBy` / `verifiedBy`. Drives generation order and QA mechanically. |
| `agents/`        | `ORCHESTRATOR.md` (run the factory) + `product/` (files emitted to the target repo). |
| `00-process/`    | Pipeline overview + the docs-generation orchestration (with the QA loop). |
| `templates/`     | The document templates + the `idea.md` input contract, the `index.md` source-of-truth map, and the `methods.md` glass-box ledger. |
| `playbooks/`     | Factory playbooks: MVP scoping + the review checklist. |
| `tools/`         | Stdlib plan-integrity gate (T6) plus the optional, preview-first GitHub Issue/Project projector. |
| `subagents/`     | The factory roster: architect (generator) + the QA verifiers. |
| `examples/`      | One complete worked reference, end to end. |

Files that moved to the idea-kit (problem-validation, market-research, interview &
research playbooks, the researcher subagent) are **not** in this repo — authoring lives in the
**idea-kit**, an optional separate repo. FMD starts at an `idea.md`; see `manifest.json` → `forge`.

## Traceability by ID

Stable IDs are the spine: `F-###` features (origin: `idea.md` §7), `UJ-###` journeys,
`BR-###` business rules, `API-###` contracts. Every `F-###` flows `idea.md` → PRD → QA test.
The `consistency-checker` parses these, so traceability is mechanical, not vibes.

## Quality: real verifier gates + living execution state

Doc QA is not a one-shot pass. Deterministic checks run first, followed by two named suite reviews:
product/claims and architecture/traceability. Each reports checks performed and human-verified
remainder; only an affected cluster is repaired, with a two-cycle cap and lead escalation. See
`00-process/docs-generation.md`.

When a build crew is selected, FMD emits one living `docs/implementation-plan.md` — no parallel
`tasks.md`. Stable `TASK-###` rows carry dependencies, owner, write scope, branch/PR ref, status, and
exact gate evidence. Execution waves derive from the dependency DAG and disjoint scopes, so the
plan scales to the actual team/time/risk instead of forcing fixed MVP→Final phases. Checkpoint
triggers reconcile it on task/decision/pivot/dependency/time/team events; code that merely follows
an unchanged spec does not churn docs. `tools/check-implementation-plan.py` is the stdlib T6 gate.
Tracked plans also carry a fact-only `docs/run-evidence.jsonl` protocol: the Build Keeper records
observed checkpoints and is the sole task-status writer. The optional GitHub projector creates one
run-scoped marker-backed Issue per task and Project projection only after a reviewed mutation digest
is activated. Markdown remains the execution truth; GitHub discussion, PRs, and cards never silently
rewrite it. After `run_closed`, the Framework Observer proposes—not applies—framework changes.

The emitted `AGENTS.md` gives every tool the same task-branch/PR/conflict protocol. Compatible clean
updates may be auto-merged by the repository host; semantic conflicts are investigated, tested, and
escalated — never blindly “auto-fixed.” Browser UI projects get conditional Playwright guidance in
the QA plan. FMD does not install dependencies or emit GitHub Actions/workflows; its GitHub tool is
explicitly configured at delivery time and defaults to a terminal dry run.

## How to update it

Improve from **real use only** — every change should trace to friction on a real project, not
abstract polish. Semver in `VERSION`; breaking structure changes are a major bump. Significant
decisions get an ADR (see `adr/`).

## The honest reminder

FMD is leverage, not a deliverable. It multiplies the speed of turning an idea into buildable
docs — and multiplies zero if no one builds the result or it wins nothing. Force it through one
real build; let real friction tell you what's missing. Don't let polishing the factory become
the project.
