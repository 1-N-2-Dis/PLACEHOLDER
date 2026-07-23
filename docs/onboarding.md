# GuidHer onboarding

Start here when joining an active GuidHer work session.

## Read order

1. [Documentation index](index.md) — find the single owner of the fact you need.
2. [Root idea](../idea.md) and [context](../context.md) — product boundaries and selected document set.
3. [Implementation plan](implementation-plan.md) — canonical `TASK-###` state. Owners are assigned
   only by the product lead.
4. [Decision ledger](DECISION-LEDGER.md) — accepted pivots, names, and invariant audits.
5. The owning PRD, architecture, data, QA, security, or operations document for your task.

## Working rules

- Work from a branch and do not push, deploy, publish, or change production data without product-
  lead authorization.
- Do not claim a task state from chat, a card movement, or an Issue. The Build Keeper updates the
  plan only from inspected work, test, review, or integration evidence.
- Report data is Supabase-owned; Firebase Auth and Firestore role records remain separate. Never
  add a browser report-write path.
- Preserve the conditions-only, one-zone, grounded-AI, report-level-severity, and no-in-app-
  response boundaries in [idea.md](../idea.md) and [PRD](prd.md). The confirmed 911 quick-dial is
  a device handoff, not a GuidHer rescue service.
- `fmd/` is tracked framework source. Use it as the process reference; do not autonomously edit
  its templates or playbooks during product work.

## When a session ends

Inspect the actual result, update the canonical owner only if its fact changed, then have the
Build Keeper update the plan and append a fact-only run event. GitHub remains an optional outbound
projection; it cannot replace the Markdown task ledger.
