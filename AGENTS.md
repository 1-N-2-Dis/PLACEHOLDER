> ⚠️ PROVENANCE: Generated from idea.md while DRAFT / not freeze-eligible. Demand is UNVALIDATED. Provisional MVP scaffolding for SparkFest elimination (July 2) — re-validate after first-party interviews. No evidence fabricated.

# SaferRoute Sta. Mesa — Agent Guide

## Project overview
SaferRoute is a community-sourced safer-routing guide for women commuting the PUP Sta. Mesa
zone (idea §6). It shows which route segments to avoid tonight and why — before a commuter
leaves — by structuring the route-safety crowdsourcing women already do by hand in private
group chats. It serves women students (18–24) at PUP Main Campus, and trans women riders in the
same zone, who today have no reliable way to know which stretches of their commute are dangerous
before they set out.

> Status: DRAFT / provisional MVP for SparkFest elimination (July 2). Demand is unvalidated —
> all evidence is third-party desk research, no first-party interviews or paid commitment yet.
> Scope, segment, and payer story to be re-validated after July 2.

## Architecture
React + Vite single-page web app, served from **Firebase Hosting**. It talks to three Google
surfaces: **Google Maps JavaScript API** (map render + segment overlays + route check),
**Cloud Firestore** (segment reports, auth-gated by Security Rules), and the **Gemini API**
(P1 risk summary) via a server-side **Cloud Function** that holds the Gemini key. Auth is
**Firebase Auth** (anonymous or Google sign-in). This satisfies the hackathon's mandatory
Google-technology requirement (Maps + Firebase + Gemini).

See [System Design](./docs/06-system-design.md) for components, data flow, and trade-offs.

## Build & run
```
npm install
npm run dev        # local Vite dev server
firebase emulators:start   # Auth + Firestore + Functions locally
```

## Test
```
npm run test       # unit/component tests
firebase deploy --only firestore:rules   # deploy + verify Security Rules
```
All changes must pass tests before they're considered done. Do not demo Firestore writes until
Security Rules pass.

## Code style & conventions
- Language / runtime: TypeScript/JavaScript (React + Vite); Node for the Cloud Function.
- Naming & patterns to follow: condition flags are a **closed enum** — `poor_lighting`,
  `no_crowd`, `recent_incident`. Every report carries `conditionType` + `timestamp` (BR-004).
  Enforce the schema client-side AND in Firestore Security Rules.
- Patterns to avoid: any free-text "crime label" / neighborhood classification field; any
  copy or UI implying rescue, SOS, or dispatch; shipping the Gemini key to the client; **emoji
  anywhere in the UI (icons or copy)** — use `lucide-react` components for every icon need
  instead (condition types, severity, status badges, etc.).

## Non-negotiable product/build rules (from PRD business rules)
- **BR-001 — Conditions only.** Reports describe fixable/observable conditions (lighting, crowd,
  recent incident). NO neighborhood crime-zone profiling, ever — not rendered, not stored.
- **BR-002 — No rescue.** No real-time rescue / SOS / dispatch promise anywhere in UI or copy.
- **BR-003 — Single zone.** Coverage is the one PUP Sta. Mesa commute zone. No metro-wide
  expansion in the MVP.
- **BR-004 — Typed + timestamped flags.** Every segment flag carries a condition type and a
  timestamp so "tonight"/freshness can be computed for the pre-trip check (F-003).
- **BR-005 — Auth to write.** Report submission requires an authenticated user (Firebase Auth).
- **BR-006 — Gemini adds no facts.** The F-004 summary is derived only from submitted reports;
  it deduplicates and structures — it never invents incidents.

## Security must-dos
- **Restrict the Google Maps key** by HTTP referrer + API allowlist in Cloud Console. The key
  ships in the client bundle by design; restriction is its only authz.
- **Keep the Gemini key server-side only**, inside the Cloud Function. Never ship it to the
  browser. (Client-side Gemini is acceptable ONLY as a knowingly-throwaway demo fallback.)
- **Deploy Firestore Security Rules before any write demo** — without rules, Firestore is
  world-writable. Rules enforce auth-to-write (BR-005) and the closed condition enum (BR-001).
- **No secrets committed** to the repo (API keys, service accounts, `.env`).

## Do not touch
- The condition enum and the "no crime-label field" rule — these are kill-criterion safeguards
  (idea §9), not implementation details.
- Firestore Security Rules and the Maps-key restriction — they are gates, not polish.

## Definition of done
- Build passes, tests pass.
- Traceability preserved: code change ties to an `F-###`; that `F-###` has a test in the QA plan.
- No secrets committed; Firestore writes are auth-gated; the Maps key is restricted; the Gemini
  key is server-side only.
- Business rules verified end-to-end (no SOS copy, single zone, condition-only data).
- Docs updated when behavior changes.

## References
- [PRD](./docs/03-prd.md) — features by `F-###`, business rules, acceptance criteria
- [System Design](./docs/06-system-design.md) — components, data flow, tech trade-offs
- [Data Model](./docs/09-data-model.md) — segment + report schema
- [QA Test Plan](./docs/11-qa-test-plan.md) — traceability matrix
- [Security & Compliance](./docs/12-security-compliance.md) — key restriction, rules, privacy

<!-- Optional: scoped, path-specific rules can be added under ./.cursor/rules/*.mdc if needed. -->
