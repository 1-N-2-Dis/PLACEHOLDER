// PROTOTYPE STUB: Firebase init replaced with no-ops so the app runs without .env config.
// Real Firebase is used in the full deployment (see docs/06-system-design.md).
// All data flows through mockReports.js / mockAuth.js for the prototype.

const noop = {};
export const app = noop;
export const auth = { currentUser: null };
export const db = noop;
export const functions = noop;
export const storage = noop;
