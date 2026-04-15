/**
 * @file Server-side session helpers — used in route `beforeLoad` guards.
 *
 * @description
 * Provides TanStack Start server functions that extract and validate the
 * current user's session from the incoming HTTP request. These are the bridge
 * between Better Auth's session management and TanStack Router's route loading
 * lifecycle.
 *
 * @architecture
 * When a user navigates to a protected route, TanStack Router calls the route's
 * `beforeLoad` hook on the server. That hook calls `getSession()` (defined
 * here), which:
 * 1. Retrieves the raw HTTP request via `getRequest()` (TanStack Start API).
 * 2. Forwards the request headers (which include the session cookie) to
 *    `auth.api.getSession()` (Better Auth server API).
 * 3. Better Auth looks up the session token in the `session` table, validates
 *    expiry, and returns the session + user object (or null).
 *
 * This flow is documented in `docs/uml/sequence-diagrams.md` §3 "Route
 * Authentication Guard".
 *
 * @consumers
 * - `routes/index.tsx` — calls `getSession()` to decide redirect (→ dashboard or → login).
 * - `routes/_authed.tsx` — calls `getSession()` in `beforeLoad`; redirects to
 *   `/login` if null, otherwise passes `session` into route context for all
 *   child routes. This is the primary auth guard for the entire authenticated
 *   section of the app.
 *
 * @note These are `createServerFn({ method: "GET" })` because they are
 * read-only (no mutations). TanStack Start may deduplicate or cache GET
 * server functions.
 */
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { auth } from "./auth";

/**
 * Returns the current session or null if the user is not authenticated.
 *
 * Used by routes that need to check auth status without enforcing it (e.g.
 * the root `/` route which redirects based on whether a session exists).
 */
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    return session;
  }
);

/**
 * Returns the current session or throws if the user is not authenticated.
 *
 * Suitable for server functions that absolutely require an authenticated user
 * and want to fail fast with a clear error rather than returning null.
 */
export const ensureSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const request = getRequest();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      throw new Error("Unauthorized");
    }
    return session;
  }
);
