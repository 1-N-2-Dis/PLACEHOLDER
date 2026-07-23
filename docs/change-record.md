# Change Record

## CR-001 — Canonical documentation migration

- **Date:** 2026-07-24
- **Author:** product lead / migration run
- **Documents changed:** framework path, canonical seed, documentation ownership map, agent guidance
- **Lifecycle:** legacy draft suite → canonical unnumbered suite
- **Change:** numbered documents and `idea.md` are replaced by canonical paths and root
  `idea.md`.
- **Reason:** the tracked framework's traceability, execution-learning, two-suite review, and
  GitHub-projection boundaries were not operating in the product repository.
- **Impact:** all links and provenance must resolve to the canonical paths; existing content is
  retained in Git history or concise legacy redirects.
- **Consequences:** future changes use `INV-###`, `TASK-###`, run evidence, and the decision ledger.

## CR-002 — Product and claims suite review

- **Date:** 2026-07-24
- **Scope:** root seed, PRD, release/GTM, pitch kit, README, and agent guidance.
- **Result:** corrected the unsupported “near-zero cost” and payer-validation pitch claims; aligned
  F-011 as a confirmed device-dialer handoff rather than an in-app response feature.
- **Human-verification boundary:** no first-party interview artifact or committed payer evidence was
  inspected in this run. Existing interview/payer statements remain unvalidated unless their source
  is supplied and reviewed.

## CR-003 — Architecture and traceability suite review

- **Date:** 2026-07-24
- **Scope:** PRD, system design, data model, methods, security, QA, implementation plan, and agent
  guidance.
- **Result:** reconciled the current Supabase report store with Firebase Auth/Firestore role
  records; added F-009..F-011 and INV-001..INV-005 traceability to the QA plan; preserved
  intentionally historical diagrams and notes as non-canonical context.
- **Verification boundary:** the frontend build, Rust routing tests, framework plan checker, and
  GitHub synchronizer self-test are local checks only. Live Supabase RLS, Firebase role rules,
  Gemini routes, and the device dialer require human/environment verification.
