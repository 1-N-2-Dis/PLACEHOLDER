# Login / account page (optional Google upgrade over anonymous auth) — design

Status: approved, implemented. **Addendum (F-009) below extends this with email/password +
admin moderation, per explicit user request that supersedes this doc's original "out of scope:
password-based accounts" line.**

## Problem

Every visitor is already signed in anonymously (`frontend/src/lib/auth.js` `ensureSignedIn()`) so
report submission has a `uid` (BR-005), but there is no UI for it and no way to upgrade to a
persistent account. AGENTS.md, the PRD (BR-005), System Design, and Security & Compliance already
describe the target auth method as "Firebase Auth (anonymous or Google sign-in)" and explicitly
reject a full email/password flow ("more UI, more time" — `docs/system-design.md`), but mark it
`[unverified]`/"undecided". This spec builds the missing UI for that already-decided direction.

## Scope

In scope (frontend): `frontend/src/lib/auth.js` (add `signInWithGoogle()`, `signOutUser()`),
`frontend/src/lib/useAuthUser.js` (new hook), `frontend/src/features/auth/AccountPage.jsx` (new),
`frontend/src/pages/AccountPage.jsx` (new page shell, mirrors `pages/ReportPage.jsx`), `App.jsx`
(new `/login` route), `AppHeader.jsx` (auth-aware nav entry), `styles.css` (small additive rules).

In scope (docs): resolve the `[unverified]` auth-method tags in `docs/prd.md`,
`docs/system-design.md`, `docs/security-compliance.md`, and the "auth method undecided" open
item in `docs/index.md`, now that the method is implemented.

Out of scope: password-based accounts, route guards/gating on `/` or `/report` (anonymous stays
the default everywhere), a separate signup form (Google sign-in both creates and authenticates the
account, so there is no distinct "signup" step).

## Design

**Auth flow.** No change to silent anonymous sign-in. `signInWithGoogle()` uses
`linkWithPopup(auth.currentUser, new GoogleAuthProvider())` so the existing anonymous `uid` — and
any reports already submitted under it — carries over. If Firebase rejects the link with
`auth/credential-already-in-use` (that Google account already belongs to a different Firebase
user), it falls back to a plain `signInWithPopup`. `signOutUser()` wraps `signOut(auth)`; a later
`ensureSignedIn()` call elsewhere re-establishes a fresh anonymous session.

**Auth state.** `useAuthUser()` wraps `onAuthStateChanged` and returns `{ user, isAnonymous }` so
`AppHeader` and the account page can read auth state reactively without prop-drilling.

**Page.** `/login` renders `pages/AccountPage.jsx` (back-link + `.report-page`/`.report-page-inner`
shell, matching `ReportPage.jsx`) around `features/auth/AccountPage.jsx`, which shows either:
- Anonymous: explanation text + "Sign in with Google" button (`LogIn` icon).
- Signed in: avatar (if present) + display name/email + "Sign out" button (`LogOut` icon).

Popup-blocked/cancelled sign-in shows an inline `.status-err` message; no redirect, no thrown
unhandled rejection.

**Header.** `AppHeader.jsx` adds a second `NavLink` to `/login`, labeled "Sign in" when anonymous
or the user's display name/email once upgraded.

**Styling.** Reuses existing classes (`.report-page`, `.report-step`, `.muted`, `.status-err`,
`.icon-line`, the default `button` rule); only additions are `.app-nav nav { gap }` (two nav links
now need spacing) and `.account-avatar` (24px circular avatar).

## Verification

1. `npm run dev`, load `/` — anonymous sign-in still fires silently, unchanged behavior.
2. Visit `/login` while anonymous, click "Sign in with Google" — header updates to show the
   display name; `currentUid()` is unchanged from before linking.
3. Submit a report anonymously, then link to Google — the report's `uid` still matches the
   (now-linked) signed-in user.
4. "Sign out" reverts the header to "Sign in"; a later `ensureSignedIn()` call establishes a new
   anonymous session without error.
5. Popup-blocked/cancelled sign-in shows an inline error, no crash or redirect loop.

## Addendum: email/password + admin moderation (F-009)

**Problem.** The user explicitly asked for an actual login/signup form (email + password, with
only a `@gmail.com`-suffix check, "for now" — no real verification), plus 1 admin + 2 end-user
demo accounts to try it with. This is a deliberate, confirmed override of this doc's original
"anonymous/Google only" scope (see [[docs/system-design.md]]'s rejected-email/password
rationale) — not a re-litigation of it. Two open questions were resolved with the user first:
admin gets a real capability (view + delete all reports, not just a role label), and the 3 demo
accounts are seeded against the **Auth emulator**, not a live project.

**Design.**
- `frontend/src/lib/auth.js`: `isGmailAddress(email)` (regex suffix check, demo-only, documented
  as such), `signUpWithEmail`/`signInWithEmail` (mirror the Google linking pattern —
  `linkWithCredential` when anonymous, so uid persists).
- `frontend/src/lib/users.js` (new): `users/{uid}` role doc — `ensureUserDoc` (self-create as
  `role: 'user'`, idempotent), `subscribeRole`.
- `frontend/src/lib/useAuthUser.js`: extended to also return `role`.
- `features/auth/AccountPage.jsx`: extended with an email/password form (mode toggle
  login/signup) alongside the existing Google button.
- `features/admin/AdminReports.jsx` + `pages/AdminPage.jsx` (new), routed at `/admin`: lists all
  reports with a delete button; renders "you need an admin account" for non-admins instead of a
  route guard/redirect (consistent with this feature's existing no-guard philosophy).
- `backend/firestore.rules`: `isAdmin()` helper; `users/{uid}` match block (self-or-admin read,
  self-only create pinned to `role: 'user'`); `reports` gains `allow delete: if isAdmin()` (still
  `update: false` — moderation is remove-only, preserves report immutability elsewhere).
- `backend/scripts/seed-auth-users.mjs` (new, mirrors `seed-segments.mjs`'s emulator/real-project
  dual-mode pattern): creates `admin@gmail.com` (role `admin`) + `user1@gmail.com`/`user2@gmail.com`
  (role `user`), shared demo password, both the Auth user and its `users/{uid}` Firestore doc via
  the Admin SDK (bypasses Rules, the only way to set `role: admin`).

**Docs updated:** `docs/prd.md` (new F-009), `docs/data-model.md` (`users` collection +
rules addition), `docs/security-compliance.md` (email/password + `users` authz surface,
demo-credential checklist item), `docs/qa-test-plan.md` (TC-028/TC-029).

**Verification (addendum):**
1. Run `npm run seed:users` (from `backend/`, against the Auth + Firestore emulators) — creates
   the 3 accounts, prints the shared demo password.
2. On `/login`, attempt signup with a non-`@gmail.com` address — rejected before any Firebase call.
3. Sign up with a valid `@gmail.com` address + 6+ char password — succeeds, `uid` unchanged if
   previously anonymous.
4. Log in as `admin@gmail.com` — `/admin` shows all reports; delete one, confirm it's gone.
5. Log in as `user1@gmail.com` — `/admin` shows "you need an admin account"; a manual `deleteDoc`
   attempt against `reports/{id}` is rejected by `backend/firestore.rules`.
