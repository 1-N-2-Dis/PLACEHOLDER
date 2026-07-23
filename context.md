---
# FMD context input — one canonical home for document selection and judged-build context.
team_size: 4
mode: team
build_type: hackathon
time_budget: multi-session
judged: true
computes_numbers: true
exposed_surface: true
outlives_demo: true
selection_mode: auto
competition:
  name: SparkFest 2026
  theme: Community-sector technology using Google technology
  format: 5-minute pitch plus 15-minute Q&A
  rubric:
    - Technology: 25
    - Relevance: 20
    - Creativity: 15
    - Uniqueness: 15
    - Feasibility: 15
    - Presentation: 10
  hard_requirements:
    - Use at least one Google technology
    - Serve the community sector
---

# GuidHer FMD context

This seed input sizes the FMD document suite. It is not an approval gate and does not
decide whether the product should be built. The source for the event format and rubric is
[`docs/00-hackathon-context.md`](docs/00-hackathon-context.md).

## Confirmed team model

- **Abu — product lead and Build Keeper:** owns product decisions, task-state checkpoints, and
  pilot go/no-go.
- **Helena — design, branding, and partner/pilot coordination:** owns participant-facing design
  and consented partner coordination; personal contact details stay outside the repository and
  GitHub Issues.
- **Jim — full-stack engineering:** owns frontend/API implementation and technical tests.
- **Farhana — DevOps/data, verification, and privacy:** owns isolated non-production operations,
  evidence review, privacy recommendations, and verification review.

The selected conditional documents are Security & Compliance (network exposure), Methods
(WASM routing and freshness calculations), Onboarding/Change Record/Decision Ledger
(team and multi-session work), Implementation Plan/run evidence/Postmortem (tracked
execution learning), Pitch Kit (judged build), and Ops/Release-GTM (a deployed service
with a continuation path). The build does not select BRD/MRD/FRD/SRS/API Spec/SAD merely
because templates exist. Existing BRD and MRD material remains historical input, not an
automatically active canonical specification.
