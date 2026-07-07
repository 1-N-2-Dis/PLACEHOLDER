# Product

## Register

product

## Users

Women students aged 18–24 at PUP Main Campus (Sta. Mesa, Manila) who commute the Sta. Mesa zone
daily — LRT-2 Pureza/Legarda, jeepneys along Pureza and Magsaysay, and the walk along Teresa
Street — especially after evening classes, often anxious about the trip home. Secondary segment:
trans women riders in the same zone. They open the app before leaving, not during travel; there is
no real-time use case.

## Product Purpose

GuidHer (internal codename SaferRoute) is a community-sourced safer-routing guide. It shows which
route segments to avoid tonight and why, before a commuter sets out, by structuring the route-safety
crowdsourcing women already do by hand in private group chats into typed, timestamped reports and an
AI-grounded (Gemini) pre-trip verdict. Success = a commuter checks a route before leaving and gets a
calm, trustworthy answer grounded only in real reports — not a guess.

## Brand Personality

Wise, watchful, warm — a companion (mascot: Owly the owl), not a cold utility or a rescue service.
Trust before delight: calm, legible, honest, no dark patterns or manufactured urgency. Honest about
its AI: Gemini structures and dedupes real reports, it never plays "AI detects danger."

## Anti-references

- No neighborhood/crime-zone profiling or place/people labeling, ever (BR-001) — conditions only
  (lighting, crowd, recent incident).
- No real-time rescue / SOS / dispatch promise in any copy, color, or iconography (BR-002).
- No fear-framed copy or gamified "danger" theatrics — empowerment framing only.
- No "AI-magic" mystical framing (glow effects implying an intelligence the product doesn't have).
  Note: this does **not** ban purple — purple is GuidHer's deliberate, intentional brand color, not
  a thoughtless AI-purple-glow gimmick. See `docs/design-system.md` §1 for this exact override.

## Design Principles

1. Trust before delight — calm, legible, honest; anxious users, no dark patterns, no fake urgency.
2. Conditions, never crime — fixable/observable conditions only, never a place or person label.
3. No rescue promise — nothing implies real-time rescue, dispatch, or "you're safe now."
4. Warmth as companion, not utility — Owly carries warmth so copy stays factual and calm.
5. Honest AI — Gemini's role is trust (structure/dedupe real reports), never invented danger signals.

## Accessibility & Inclusion

WCAG AA contrast (body ≥4.5:1, large text ≥3:1) verified in **both** light and dark themes.
`prefers-reduced-motion` honored globally. Touch targets ≥44px on mobile nav/map controls.
Every icon-only button carries an `aria-label`. Keyboard `:focus-visible` outline kept on all
interactive elements.
