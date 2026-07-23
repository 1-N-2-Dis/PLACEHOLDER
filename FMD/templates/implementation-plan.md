# Implementation Plan — living execution state

> **Purpose:** the canonical bridge from specs to code **and the current build state**. It answers:
> what is ready, blocked, in review, done, or cut; who owns it; what it may touch; and what evidence
> proves it. It does not duplicate product intent, architecture, test definitions, or decisions —
> those remain in the PRD, system design, QA plan, and decision ledger.
>
> Traces to: `prd` (`F-###` / `INV-###`), `system-design`, `qa-test-plan` (`TC-###`), and `sad`
> when present. Stable task IDs originate here as `TASK-###`; never renumber or reuse one.

**Plan steward:** <one person/agent who owns cross-task replanning>
**Last checkpoint:** <ISO-8601 timestamp + event>
**Deadline / demo cutoff:** <from build context; distinguish submission time from demo-ready time>
**Current stopping point:** <the last independently working slice we can honestly demo if time ends now>

## 1. Planning inputs (refresh when context changes)

- **Current code state:** <greenfield / existing skeleton / working slices; link, do not narrate history>
- **Team capacity:** <member/agent → skills, availability, current task; `UNASSIGNED` is honest>
- **Core demo journey:** <UJ-### or shortest user-visible path that proves the value>
- **Highest implementation risks:** <unknown integration, data, auth, deployment, performance, etc.>
- **Required quality commands:** `<fast targeted command>` · `<full required command>`
- **Browser E2E:** <N/A — no browser UI | Playwright command + covered TC-### cases>
- **Hard constraints / rubric:** <links to canonical context, PRD, security, or pitch sections>

## 2. How this plan scales (derive; do not force fixed MVP→Final phases)

1. Start with the smallest **independently testable vertical slice** through the core demo journey.
2. Extract setup or shared foundation only when it truly blocks multiple slices. Do not create an
   infrastructure phase merely because it looks orderly.
3. Split work until one task has one owner, a bounded write scope, one reviewable work reference
   (branch/PR), and one executable gate. Keep coupled changes together; do not split by frontend /
   backend if that makes neither side testable.
4. Build the dependency DAG from `Depends on`. The **execution waves are its topological layers**:
   tasks in the same wave may run together only when their write scopes do not overlap. Do not store
   a second, manually maintained phase truth that can disagree with the DAG.
5. Allocate ready tasks by actual skills and availability, not equal-looking task counts. One named
   **Build Keeper** owns task-state/dependency/order changes; contributors submit observed evidence
   instead of editing task rows.
6. Put the demo-critical path before polish. Define a working stopping point and mark optional work
   `cut` when time changes; never hide a cut by deleting its task.

Scale by context, not ceremony:
- **Solo / short:** one active task, very few slices, targeted gate after each; no fake parallel lanes.
- **Small team / deadline:** one lane per person only where the DAG and write scopes permit it; integrate
  continuously around the core demo journey.
- **Larger / longer:** more independently testable slices and owners, not bigger tasks; keep shared-file
  work serialized through the plan steward.

## 3. Task ledger (single source of execution status)

Allowed status: `ready | in_progress | blocked | in_review | done | cut`. A task is `ready` only
when every dependency is `done`; otherwise keep it `blocked` and name the blocker in the execution
view. Claimed/reviewed/done tasks also require all dependencies done.
`Work ref` is `—` until claimed, then `task/TASK-###-slug`, a PR URL/number, or an equivalent review ref.
`Gate / evidence` names `TC-###` and the exact command in backticks. `in_review`/`done` also
require observed evidence outside the command using `result: PASS`, `result: exit 0`, `CI: green`,
or `artifact: <URL>`; a success word printed inside the command is not evidence.
Use comma-separated `TASK-###` dependencies or `—`. Use concrete file paths/globs in `Write scope`.

| ID | Outcome / trace | Depends on | Owner | Write scope | Work ref | Status | Gate / evidence |
|----|-----------------|------------|-------|-------------|----------|--------|-----------------|
| TASK-001 | <runnable skeleton; infra> | — | <owner> | <paths> | — | ready | `<boot/build command>` |
| TASK-002 | <smallest core slice; F-###, UJ-###> | TASK-001 | <owner> | <paths> | — | blocked | TC-### · `<targeted command>` |
| TASK-003 | <next independently testable slice; F-###> | TASK-001 | <owner> | <paths> | — | blocked | TC-### · `<targeted command>` |

## 4. GitHub delivery projection (terminal-managed, conditional)

> **Markdown remains canonical.** GitHub Issues hold task discussion and PR links; GitHub Projects
> visualizes the ledger. This section is emitted with every implementation plan so a new build is
> ready to connect, but it makes no network call and creates no project until the owner explicitly
> approves the tool's mutation manifest.

**Run ID:** `RUN-<YYYYMMDD>-<short-slug>`

**GitHub delivery mode:** `not configured | previewed | active | suspended | closed`

| Setting | Value |
|---|---|
| Issue repository | `<OWNER>/<REPO>` |
| Project owner | `<GitHub user or organization>` |
| Project number / create title | `<number> / <new Project title>` |
| Projection direction | Markdown plan → Issue snapshot + Project fields |
| Inbound rule | PR/CI/Issue evidence becomes a proposed Markdown diff or PR; it never silently rewrites this ledger |
| Activation record | `<lead name> · <timestamp> · preview SHA-256 · scope: create Issues / FMD block / FMD fields>` |

The synchronizer creates one Issue per immutable `TASK-###`, marked with the run-scoped identity
`<!-- fmd-task:RUN-...:TASK-### -->`, and owns only its generated Issue block. It preserves the
Issue title after creation, comments, labels, assignees, and PR discussion. It creates/uses these terminal-manageable Project fields:
`FMD Task` (text), `FMD Status` (Ready / In Progress / Blocked / In Review / Done / Cut), and
`FMD Wave` (number). Do not substitute an Issue number or a card position for `TASK-###`.

**First-run sequence:**

1. Validate the plan: `python3 fmd/tools/check-implementation-plan.py docs/implementation-plan.md`.
2. Preview exactly what will change (no remote writes):
   `python3 fmd/tools/sync-github-project.py --plan docs/implementation-plan.md --run-id RUN-<...> --repo <OWNER>/<REPO> --project-owner <OWNER> --create-project-title "<Project title>"`.
3. The lead reviews the operations and `MANIFEST SHA256`, records that activation above, then applies
   the same command with `--apply --expected-manifest-sha <SHA>`; subsequent runs use
   `--project-number <N>` instead of `--create-project-title`.
4. While mode is `active`, the Build Keeper may preview then apply an unchanged-scope checkpoint
   projection. A stale digest, duplicate marker, incompatible field, or lead revocation changes the
   mode to `suspended`; it never blocks coding. `run_closed` changes the mode to `closed`.
5. At a checkpoint, inspect PR/CI/Issue evidence and propose the smallest Markdown-plan diff. Only
   the Keeper marks `done` after integration and a passing gate on the current base.

## 5. Run evidence and closure

`docs/run-evidence.jsonl` is an append-only fact ledger, not a permission gate. Record `run_started`,
IdeaForge/FMD completion, the first working slice, rework, pivots, demo/feedback, and `run_closed`.
Use `python3 fmd/tools/record-run-event.py --type <event> --source <observed source> --evidence-ref <ref>`.
Unknown timing, rework, or feedback stays `unknown`; never estimate it. The product lead may disable
recording with a reason, in which case later causal learning is explicitly incomplete.

## 6. Current execution view (derived from the ledger)

<!-- Recompute at each checkpoint; never hand-maintain a competing phase plan.
     `check-implementation-plan.py` prints the topological waves and flags same-wave write-scope
     overlaps — use that deterministic output as the basis instead of hand-deriving it. -->
- **Ready now:** <tasks whose dependencies are done and write scopes are available>
- **Safe parallel set:** <ready tasks with disjoint write scopes; or `none`>
- **Blocked:** <task → blocker → owner of unblock>
- **Integration order:** <the order the current ready set should land>
- **Cut line:** <tasks to mark `cut` first if remaining time/team capacity changes>

## 7. Checkpoint transaction (the self-reconciliation loop)

Run a checkpoint when any of these occurs:
- a task is claimed, blocked, submitted for review, merged, cut, or fails its gate;
- a decision/pivot is accepted;
- implementation reveals a new dependency or invalid plan assumption;
- remaining time, team availability, rubric, or scope changes;
- before a demo, handoff, or work-session end.

At one checkpoint, make one coherent transaction:
1. **Observe reality:** inspect the branch/PR, code, tests, and current canonical docs. Do not infer
   completion from chat or a checked box.
2. **Build Keeper updates the task ledger:** change only facts proven by the event; add discovered
   work with a new `TASK-###`; never renumber/delete history. A failed test changes the plan only if
   it changes scope, dependencies, ownership, or sequencing.
3. **Reconcile by owner:** if intended behavior changed, update the PRD/brief owner first; architecture
   → system design; test intent → QA plan; significant decision/pivot → decision ledger/ADR. If code
   merely implemented the existing spec, do **not** churn docs.
4. **Recompute the execution view:** ready set, blockers, safe parallel set, integration order, cut line.
5. **Attach evidence:** task/PR link + exact command/result. The Keeper records `in_review` before
   merge and marks `done` only after integration and a current-base passing gate.
6. **Run plan validation:** `python3 fmd/tools/check-implementation-plan.py docs/implementation-plan.md`
   (adjust the `fmd/` path to the vendored/copied kit location).

This is **build-level self-reconciliation**, not autonomous kit self-improvement. FMD itself changes
only after the post-build retro provides real evidence and a human curates the framework change.

## 7. Team branch, PR, and conflict protocol

<!-- Keep tool-neutral. Use repository-native equivalents if not on GitHub. -->
1. **Start a task.** Either claim one `ready`, unowned task yourself, or start one the Keeper
   already assigned to you (`Owner` is pre-filled — do not re-claim it from someone else). Create
   `task/TASK-###-short-slug` from the current default branch and give the Keeper the work reference;
   it records `in_progress`. Never share a working branch.
2. Stay inside the declared write scope. If a new shared file is needed, checkpoint first; the plan
   steward either serializes the work or changes scopes/dependencies.
3. Open a small draft PR early. It names `TASK-###`, affected `F-/INV-###`, docs impact (`none` is valid),
   and the exact validation commands.
4. **When the work is actually done (this is the owner's own checkpoint, not just the steward's):**
   a. Run `python3 fmd/tools/check-implementation-plan.py docs/implementation-plan.md` and fix any
      REJECT before proceeding.
   b. Attach real observed evidence to `Gate / evidence` (`result: PASS`, `CI: green`, or an
      artifact URL) — not just the command.
   c. Give the Keeper the PR and gate evidence; it records `in_review` as the review signal.
   d. Update canonical docs (PRD/system design/QA) in the same PR **only if intended behavior
      actually changed** — implementing the existing spec unchanged should not churn docs.
5. Bring the latest default branch into the task branch before final review and rerun required gates.
   Repository CI/branch protection is the merge gate; auto-merge or a merge queue may land a **clean,
   passing** update when the host/plan supports it.
6. A real conflict is not safe to solve with blanket `ours`/`theirs`. Investigate both intents and the
   canonical docs, resolve the smallest correct diff, run targeted tests plus the core smoke path, and
   record any changed decision. After three failed resolution attempts, stop and escalate (Iron Law).
7. **After merge, the Build Keeper — not the task owner — sets `Status` to `done`**, and only once
   the change is integrated and the gate still passes on the current base. This separation exists so
   no one marks their own work `done` before it is actually merged.

**Automation boundary:** Git can automatically integrate non-conflicting changes and CI can reject a
bad combined result. No free tool can guarantee a correct semantic merge conflict resolution. An AI
may propose a resolution, but tests + review decide; unresolved intent goes to the plan steward/human.

## 8. Plan change log (append-only, concise)

| Timestamp / event | Tasks changed | Why / evidence | Canonical docs reconciled |
|-------------------|---------------|----------------|---------------------------|
| <ISO-8601 · kickoff> | TASK-001… | initial dependency/risk cut | PRD · system design · QA plan |
