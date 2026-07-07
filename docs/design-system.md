# Design System — GuidHer

> **Owner: Helena.** This is a living doc — meant to be altered, iterated, and improved, not frozen.
> It is the canonical home for GuidHer's **visual/brand system, design tokens, UI components, and UI
> voice** (see [index.md §0](./index.md)). The app *and* the pitch deck both pull from here so they
> never drift apart.
>
> **Grounded in real code, not invented.** Everything below is transcribed from the current build —
> primarily `frontend/src/styles.css` (`:root` tokens), `frontend/index.html` (fonts), and
> `frontend/src/data/{condition-types,severity-types}.js`. When you change a token in code, update
> the matching row here (and vice-versa). Last synced: 2026-07-06.
>
> **How to iterate:** capture Ate Ayen / Kuya Troy feedback in §11, run the `design-taste-frontend`
> skill (`.agents/skills/`) for redesign passes, and log every real change in §12 + a line in
> [POSTMORTEM §3](./POSTMORTEM.md). Product rules that constrain design (BR-001/002) are owned by the
> [PRD](./03-prd.md) — this doc applies them, it does not redefine them.

## 0. Design principles (why the UI looks the way it does)

1. **Trust before delight.** This is a safety product for women who may be anxious. Calm, legible,
   honest. No dark patterns, no fake urgency, no gamified "danger" theatrics.
2. **Conditions, never crime (BR-001).** Language and iconography describe *fixable, observable*
   conditions (lighting, crowd, recent incident) — never crime-zone or place/people labels. This is
   a hard product rule, not a style choice.
3. **No rescue promise (BR-002).** Nothing in copy, color, or iconography may imply real-time
   rescue, SOS, dispatch, or "you're safe now."
4. **Warmth, not sterility.** GuidHer is a companion (Owly the owl), not a cold utility. Purple +
   pink + gold + cream, rounded shapes, a friendly display font.
5. **Honest AI.** No "AI-magic" purple-glow gimmicks to imply intelligence the product doesn't have.
   Gemini's role is trust (structure/dedupe real reports), and the UI should look trustworthy, not
   mystical.

## 1. Two conventions that OVERRIDE generic design advice (read this first)

The `design-taste-frontend` skill is a great iteration tool, but two of its *defaults* are
deliberately overridden for this project. Don't let a tool "correct" the brand:

| Skill default | GuidHer's deliberate choice | Why it's allowed |
|---|---|---|
| "Discouraged: `lucide-react`" | **`lucide-react` is the project standard, everywhere** | Mandated in [AGENTS.md](../AGENTS.md); the whole icon set + condition/severity glyphs are lucide. One family, consistently. Do **not** introduce a second icon library. |
| "The Lila Rule — AI-purple is discouraged" | **Purple *is* the GuidHer brand** (`#4B2E83`) | This is an intentional, harmonised brand palette (purple + pink + gold + cream), not a random AI-gradient reach. The rule bans *thoughtless* purple glow; it does not ban a purple brand executed with intent. |

Everything else in the skill (contrast checks, state completeness, layout discipline, emoji ban)
**does** apply. In particular: **no emoji anywhere** — use lucide glyphs or the Owly illustrations.

## 2. Brand

- **Product name:** **GuidHer** (public). Wordmark renders as `Guid` in primary purple + `Her` in
  accent pink (`.brand-wordmark .accent`), display font. Internal codename "SaferRoute" must not
  appear on any judge-facing surface (see [POSTMORTEM §1](./POSTMORTEM.md)).
- **Logo mark:** `BrandMark` = the circular owl-face app icon (`GuidHer_Assets/appicon.png`),
  distinct from the full mascot. Used in the nav and auth screens.
- **Mascot: Owly** — "Wise. Watchful. With you." An illustrated owl with context-specific poses in
  `GuidHer_Assets/` (`welcome`, `caution`, `cheering`, `looks-out`, `ontheway`, `otwlrt`,
  `pointstheway`, `protect`, `safelyarrived`, `shareandhelp`, `walkinghome`). Owly carries warmth so
  the UI copy can stay factual. Rendered via `components/Owly.jsx` with a `pose` prop.
- **Taglines (in use):** primary — **"Know your route. Own your night."** (`index.html`); mascot —
  **"Wise. Watchful. With you."** Keep taglines empowerment-framed, never fear-framed, never a
  safety guarantee (BR-002).

## 3. Color tokens

Source of truth: `:root` in `frontend/src/styles.css`. Dark-mode values under `[data-theme="dark"]`.

### 3.A Brand palette (light)
| Token | Hex | Role |
|-------|-----|------|
| `--primary` | `#4B2E83` | Primary purple — brand, primary buttons, headings, links-on-brand |
| `--primary-hover` | `#3a2166` | Primary hover |
| `--secondary` | `#7D5CC7` | Secondary purple — focus rings, links, accents |
| `--lavender` | `#B69AD9` | Soft lavender — gradients, supporting |
| `--pink` | `#F28DBB` | Accent pink — the "Her" in the wordmark, highlights |
| `--cream` | `#FFF2E1` | Warm cream — landing background, warm surfaces |
| `--gold` | `#FFC857` | Golden yellow — accents, highlights |
| `--ink` | `#1a1a2e` | Primary text |
| `--muted` | `#6b7280` | Secondary/caption text |
| `--line` | `#e8e0f5` | Borders, dividers |
| `--bg` | `#f9f5ff` | App background |
| `--card` | `#ffffff` | Card/surface |
| `--surface` | `#f3eeff` | Subtle raised surface, chips |

### 3.B Severity & status (semantic — do not repurpose)
| Token | Light hex | Role |
|-------|-----------|------|
| `--okay` / route-green | `#2e7d32` | **Routing outcome** = "safest we found" (route lines, safe states, success). |
| `--flag` | `#c62828` | Danger/error/red severity |
| Severity **green** icon | `#8b5cf6` (purple-ish) | Report severity "Low concern" — **deliberately purple, NOT green**, to avoid confusion with route-green (see `severity-types.js`). |
| Severity **yellow** | `#f9a825` | Report severity "Caution" |
| Severity **red** | `#c62828` | Report severity "Dangerous" |
| `--sev-green/yellow/red-bg` + `-fg` | see code | Dark-mode-safe chip pairs for badges |

> **Critical nuance to preserve:** *route green* (a routing recommendation) and *report severity*
> are different concepts. Report "low concern" severity is rendered **purple**, not green, on
> purpose — so a low-concern pin never reads like a "safe route." Don't "fix" this to green.

### 3.C Dark mode
Full `[data-theme="dark"]` token set exists (purple lightens, cream text, deep-purple surfaces).
Theme is user-toggled and persisted (`lib/theme.jsx`, `localStorage` key `guidher_theme`). Every new
component must be verified in **both** themes before shipping. The public landing page
(`WelcomePage.jsx`) is theme-aware too, with its own toggle in `LandingNav` — this **supersedes**
the "fixed brand surface" note that used to live in §6; only the auth screen's purple gradient
background stays fixed.

## 4. Typography

Fonts loaded in `frontend/index.html` (Google Fonts) — swap to self-hosted before any production
hardening if perf matters (the design-taste skill flags `<link>` fonts).

| Role | Font | Tokens / classes |
|------|------|------------------|
| Display / headings / wordmark | **Baloo 2** (fallback Outfit) | `--font-display`; `.text-display`, `.text-h1/.text-h2`, `.brand-wordmark` |
| Body / UI | **Inter** | `body` default; `.text-body`, `.text-label`, `.text-caption` |

Type scale (from `styles.css`): `.text-display` `clamp(1.6rem,4vw,2.2rem)`/800 · `.text-h1`
1.4rem/700 · `.text-h2` 1.1rem/700 · `.text-body` 0.95rem/1.6 · `.text-label` 0.85rem/600 muted ·
`.text-caption` 0.75rem muted. Display is tight-tracked (`-0.02em`); body is not.

## 5. Shape, elevation, spacing, motion

- **Radius:** `--radius-sm 8px`, `--radius-md 14px`, `--radius-lg 22px`, `--radius-full 999px`.
  Buttons 12px, pills/badges full. Keep the scale consistent (shape-consistency lock).
- **Elevation:** `--shadow-sm/md/lg`, all **purple-tinted** (`rgba(75,46,131,…)`) in light mode —
  never pure-black drop shadows on light. Dark mode uses neutral-black shadows.
- **Spacing:** utility classes `mt-/mb-12/14/16/20/24/32`; cards pad 20px (`.card-sm` 14–16px).
- **Motion:** subtle. `fadeUp` entrance (0.35s), `spin` spinner, `float`/`heat-pulse` ambient. All
  gated by `prefers-reduced-motion: reduce` (already handled globally). Keep MOTION low — this is a
  trust-first product, not an Awwwards demo.
- **Landing-page glass surfaces are deliberate, kept in light mode.** `.landing-nav`,
  `.land-band-tint`/`-cream`, `.feature-card-v2` use translucent-rgba + `backdrop-filter` over the
  landing page's blob decorations — this is the established light-mode look and is intentionally
  preserved as-is (2026-07-07, reaffirmed same day after a brief attempt to convert them to solid
  surfaces). Each has a `[data-theme="dark"]` companion so dark mode still works; don't touch the
  light-mode rgba values when adjusting dark mode.

## 6. Core components (existing, in `styles.css`)

- **Buttons** `.btn` + variants: `-primary`, `-secondary`, `-outline`, `-ghost`, `-danger`,
  `-white`/`-white-outline`/`-ghost-white` (on brand backgrounds), sizes `-sm`, `-full`. All have
  `:disabled` (opacity 0.5). Verify text/bg contrast on every variant (a11y).
- **Cards** `.card` / `.card-sm`; feature/tip cards `.tip-card` (left accent bar).
- **Forms** `.form-group`/`.form-label`/`.form-input` — **label above input** (never
  placeholder-as-label), focus ring = `--secondary`. Textareas resize-vertical.
- **Badges** `.status-badge` + `.badge-green/yellow/red/gray` (severity/status).
- **Chips** `.pref-chip`, `.condition-btn` (selected state = purple border + surface fill).
- **Navigation:** desktop `.app-nav` (`AppHeader.jsx`) + mobile `.bottom-nav` (`BottomNav.jsx`,
  shows < 768px). Nav items: Home · Safety Map · Routes · Reports · Safety Tips (+ Admin if role).
- **Map surfaces:** `.map-controls`, `.route-option(s)`, `.bottom-center-overlay`/`.overlay-card`
  (the RouteCheck overlay), `.seg-dot--green/yellow/red` markers, `.heat-marker--yellow/red` (F-010
  heatmap, pointer-events:none so it never steals clicks), MapLibre popup theming.
- **Auth/landing:** `.auth-screen` (firefly SVG + purple gradient, fixed regardless of theme),
  `.auth-card` (theme-aware via `var(--card)`), `.landing` (cream in light / deep-purple `--bg` in
  dark, animated blobs + grid, own toggle in `LandingNav`). These are the most "designed" surfaces —
  judge-facing.

## 7. Iconography

- **Library:** `lucide-react` only (project-wide). One family. No emoji, no hand-rolled SVG icons.
- **Condition icons** (`data/condition-types.js`): `poor_lighting` → `LightbulbOff`, `no_crowd` →
  `UserX`, `recent_incident` → `Siren`.
- **Severity icons** (`data/severity-types.js`): green → `CheckCircle2` (purple `#8b5cf6`), yellow →
  `AlertTriangle` (`#f9a825`), red → `AlertOctagon` (`#c62828`).
- **Nav icons:** Home, Map, Navigation, Flag, BookOpen; theme toggle Sun/Moon; profile User.
- Standardize icon `size` per context (nav 18–21px, inline 16px) and keep stroke weight consistent.

## 8. UI voice & copy rules (enforced, not optional)

- **Conditions, not crime (BR-001).** "Poorly lit," "few people around," "recent incident here."
  Never "dangerous area," "crime zone," or anything labeling a place or people.
- **No rescue language (BR-002).** No "Get help," "SOS," "We'll send someone," "You're safe."
- **Recommended = "safest we found,"** not "safe." Always surface the alternative (F-005).
- **Empowerment framing**, not fear. Owly poses carry warmth; text stays factual and calm.
- **Honest about the AI.** "Gemini structures and checks real reports" — never "AI detects danger."

## 9. Accessibility baseline (already partly in place — hold the line)

- `:focus-visible` outline (2px `--secondary`) is global — keep it on interactive elements.
- `prefers-reduced-motion` is honored globally — any new animation must respect it.
- **Contrast:** audit every button/badge/form for WCAG AA (4.5:1 body, 3:1 large) in **both**
  themes. The dark-mode-safe `--sev-*` pairs exist for this reason.
- Touch targets ≥ 44px on the mobile bottom nav and map controls.
- Every icon-only button needs an `aria-label` (pattern already used in `AppHeader`/`BottomNav`).

## 10. Deck ↔ app alignment (for the pitch)

The pitch deck must look like the product. Pull from this doc: primary purple `#4B2E83`, accent pink
for the "Her", Baloo 2 display / Inter body, Owly for warmth, cream/purple backgrounds. Slides use
the **same** severity colors and the same conditions-only language. See
[pitch-deck-playbook.md](./analysis/pitch-deck-playbook.md) (method) and
[alex-pitch-kit.md](./analysis/alex-pitch-kit.md) (content). Presentation is only 10 rubric points —
keep the deck clean and on-brand, don't over-invest.

## 11. Feedback capture — Ate Ayen & Kuya Troy (fill in after the calls)

> Helena owns the outreach ([BUILD-GUIDE](./BUILD-GUIDE.md)). Log concrete suggestions here, then
> promote the actionable ones into the sections above + §12. Do not invent feedback — leave blank
> until captured.

| Date | From | Area (color/type/layout/copy/…) | Concrete suggestion | Decision (adopt / adapt / reject) |
|------|------|----------------------------------|---------------------|-----------------------------------|
| _tbd_ | Ate Ayen | | | |
| _tbd_ | Kuya Troy | | | |

## 12. Change log (design decisions)

- **2026-07-07 (impeccable audit pass)** — Ran a static `critique`/`audit` pass (impeccable skill;
  browser-overlay assessment skipped, no browser tool in session — disclosed per the skill's rules)
  across every page/component. Fixes:
  - **`ProfilePage.jsx`**: emergency contacts were fully wired (state, handlers, `CONTACT_DEFAULTS`,
    even the icon imports) but never rendered — added the missing card using the already-defined
    `.contact-item`/`.contact-avatar`/etc. tokens (`styles.css`) that had sat unused.
  - **`SafetyTipsPage.jsx`**: the tip-category accordion header was a `<div onClick>` — not
    keyboard-operable, no `aria-expanded`. Now a real `<button>`. Tip-item hover feedback moved from
    a JS `onMouseEnter`/`onMouseLeave` style-mutation anti-pattern to a CSS `:hover` rule
    (`.tip-item-modern`, driven by a `--tip-accent` custom property so the per-category color stays
    dynamic).
  - **`AccountPage.jsx`/`AdminPage.jsx`**: were on an older `.report-page`/raw-arrow-link layout,
    inconsistent with every other page's `.page-scroll`/`GradientBlobs`/`ArrowLeft`-button pattern
    (`ReportPage.jsx` is the reference). Brought both in line; gave AdminPage's non-admin fallback an
    actual `.card` + icon instead of a bare paragraph. Removed the now-orphaned `.report-page`/
    `.report-page-inner` CSS.
  - Removed dead CSS: `.tip-card`/`.tip-card-v2` and friends (an older Safety Tips design, superseded
    by the accordion, never referenced in JSX) — this also resolved a scanner-flagged "side-tab
    accent border" anti-pattern by deleting the code that had it, rather than patching unused CSS.
  - Fixed a second scanner-flagged clash: `.feature-card.step-card`'s 4px accent border against its
    rounded corners — down to a plain 1px `--secondary` border.
  - Token cleanup: dropped a redundant `color="#fff"` (inherits from `.dash-card--hero` already),
    removed several one-off `rgba(0,0,0,X)` Owly drop-shadows that were silently overriding the
    existing `.owly-flipped`/`.owly-shadow` classes, folded `RoutesPage.jsx`'s inline footer/actions
    layout into the `.route-card-footer`/`.route-actions`/`.route-conditions` classes.
  - Considered and rejected: the scanner flagged `font-family: Inter` as "overused" — not changing
    it, since Inter is a deliberate pairing with Baloo 2 (contrast-axis typography, per impeccable's
    own rule), not a lazy default.
- **2026-07-07 (later still)** — Landing page's three content sections ("What GuidHer does",
  "How it works", "Zone data, tonight") previously repeated the same `land-tag` eyebrow-above-
  heading formula three times — a documented AI-slop tell (impeccable skill: "an eyebrow on every
  section is AI grammar"). Kept the tag only on Features (the one earned instance, paired with the
  glass carousel). "How it works" now leans on its numbered steps alone for identity (`.step-number`
  bumped 2rem → 2.75rem to carry that weight). "Zone data, tonight" dropped its tag in favor of a
  `.live-pulse-dot` indicator on the actual `zone-preview-head` panel — reads as a live-status
  widget instead of a marketing label, without implying real-time tracking/rescue (BR-002 still
  holds: it signals "these are tonight's reports," not "someone is watching you live").
- **2026-07-07 (later same day)** — Briefly converted the landing page's glass surfaces
  (`.landing-nav`, `.land-band-tint`/`-cream`, `.feature-card-v2`) to solid `var(--card)`/
  `var(--surface)` surfaces, then **reverted on request**: the light-mode look stays exactly as it
  was: translucent-rgba + `backdrop-filter`. Only the `[data-theme="dark"]` companion rules for
  each are new. See §5.
- **2026-07-07** — Landing page (`WelcomePage.jsx`) made theme-aware with its own toggle in
  `LandingNav`, superseding the earlier "fixed brand surface" call (see §3.C, §6). Report severity
  colors (`severity-types.js`) switched from raw hex to CSS var refs to fix a dark-mode contrast
  failure on severity-red. See [POSTMORTEM §3](./POSTMORTEM.md).
- **2026-07-06** — Doc created, transcribed from the current build (`styles.css` tokens,
  `index.html` fonts, condition/severity modules). Baseline captured so iteration has a reference.

## References
- Code: `frontend/src/styles.css` (tokens), `frontend/index.html` (fonts/meta),
  `frontend/src/data/condition-types.js`, `frontend/src/data/severity-types.js`,
  `frontend/src/components/{AppHeader,BottomNav,BrandMark,Owly}.jsx`.
- Rules that constrain design: [PRD](./03-prd.md) (BR-001 conditions-only, BR-002 no rescue),
  [AGENTS.md](../AGENTS.md) (lucide-only, no emoji).
- Iteration tool: `.agents/skills/design-taste-frontend/SKILL.md`.
- Pitch alignment: [pitch-deck-playbook.md](./analysis/pitch-deck-playbook.md),
  [alex-pitch-kit.md](./analysis/alex-pitch-kit.md).
