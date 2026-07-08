# Guest access restrictions — design

Status: approved

## Problem

The landing page's "View Safety Map" guest button (`frontend/src/pages/WelcomePage.jsx`
`handleGuest`) calls the real mock `login()` with a fake `guest@guidher.app` email. This creates a
normal, persisted mock user (`frontend/src/lib/mockAuth.js` writes it to `localStorage`) that is
indistinguishable from a real account and carries no restrictions. A "guest" today can report
incidents and edit a profile exactly like a signed-in user, which contradicts the intent of a
guest-only preview mode.

## Scope

In scope: making guest a real, unprivileged state that can view the Map, Routes, and Safety Tips
pages, but is redirected to the login form if it tries to reach `/report` or `/profile`.

Out of scope: `/dashboard` stays reachable by guests (confirmed to render safely with no `user`,
and treated as general overview content, not account-gated). No change to the real Firebase
anonymous-auth layer (`frontend/src/lib/auth.js`) or to backend enforcement
(`backend/server/index.js`'s `requireAuth`) — report submission already requires a Firebase ID
token server-side regardless of what the frontend does; this spec only fixes the frontend UX gate
so guests can't reach the report/profile UI in the first place.

## Design

**Guest is a real, in-memory state, not a fake account.** `App.jsx` adds local state `isGuest`
(`useState(false)`), never persisted to `localStorage`. The top-level gate changes from
`if (!user || !entered)` to `if ((!user && !isGuest) || !entered)`, so the app shell can mount with
`user === null` when in guest mode. `WelcomePage`'s guest button stops calling `login(...)`
entirely — it calls a new `onGuest` prop (wired to a new `enterGuest()` in `App.jsx` that sets
`isGuest = true` and enters at `/map`, mirroring the existing `enterApp` used for a real login).
Since guest entry no longer awaits a fake mock-auth network delay, the guest button's
busy/spinner state is removed as dead code along with it.

One consequence worth calling out: refreshing the page while in guest mode now correctly drops
back to the landing page (no `user` was ever written to `localStorage`), instead of today's
behavior where the fake guest account persists across reloads.

**Route guard for account-only pages.** New `frontend/src/components/RequireUser.jsx`, modeled
directly on the existing `RequireAdmin.jsx` pattern: reads `user` from `useAuth()`; if there is no
user (guest), it calls an `onBlocked` callback (via `useEffect`, since it's a state-changing side
effect) and renders nothing; otherwise renders `children`. In `App.jsx`'s route table,
`/report` and `/profile` are each wrapped in `<RequireUser onBlocked={onRequireLogin}>`.
`/dashboard`, `/routes`, `/map`, `/tips` are untouched.

**Redirect target: straight into the login form.** `onRequireLogin` is a new `requireLogin()` in
`App.jsx`: clears `isGuest`, sets a new `forceLoginView` flag, and resets the URL to `/` (same
`navigate('/', { replace: true })` pattern already used by `logout()` in `authContext.jsx`, to
avoid `AuthenticatedApp`'s `<Routes>` remounting against a stale sub-route). `WelcomePage` gains an
`initialView` prop; when `forceLoginView` is true, `WelcomePage` mounts with
`view` initialized to `'login'` instead of `'landing'`, so the visitor lands directly on the
sign-in form rather than the landing hero.

**Nav stays visible; the guard is the single enforcement point.** No changes to `BottomNav` — its
Reports tab is already unconditionally visible. `AppHeader`'s Profile button currently renders only
when `{user && (...)}`; that condition is removed so guests see the Profile button too and get
redirected on click, matching the Reports tab's "visible, redirect on click" behavior agreed with
the user. This keeps enforcement in one place (the `RequireUser` route guard) regardless of entry
point — bottom nav, header nav, or a typed-in URL.

## Files touched

- `frontend/src/App.jsx` — `isGuest`/`forceLoginView` state, gate condition, `enterGuest`,
  `requireLogin`, route wrapping for `/report` and `/profile`.
- `frontend/src/pages/WelcomePage.jsx` — `onGuest`/`initialView` props, remove
  `login(...)`-based guest flow and its busy/spinner state.
- `frontend/src/components/AppHeader.jsx` — always render the Profile button.
- `frontend/src/components/RequireUser.jsx` — new file.

## Verification

1. `npm run dev`, load `/`, click "View Safety Map" — lands on `/map` with no `localStorage`
   `guidher_auth` entry written (guest is not a persisted account).
2. As guest, navigate to Routes and Tips via the bottom nav — both render normally.
3. As guest, click the Reports tab (or navigate to `/report` directly) — immediately redirected to
   the landing page's login form, not the landing hero.
4. As guest, click the header Profile button (or navigate to `/profile` directly) — same redirect
   to the login form.
5. As guest, refresh the page mid-session — returns to the landing page (no phantom persisted
   session), unlike today's behavior.
6. Sign in for real (email/password via the landing page login form) — `/report` and `/profile`
   are reachable normally, unaffected by the guard.
7. Confirm `/dashboard` still renders for a guest with no console errors (it already falls back to
   `'Commuter'` when `user` is null).
