/**
 * @file Better Auth client-side SDK — used in React components and route pages.
 *
 * @description
 * Creates the Better Auth client that communicates with the auth server
 * endpoints at `/api/auth/*`. This module is **client-safe** and intended for
 * import in browser-executed code (route components, event handlers).
 *
 * The client is configured with a `baseURL` that tells it where the auth API
 * lives. In development this is `http://localhost:3000`; in production it
 * should be set via the `VITE_BETTER_AUTH_URL` environment variable (the
 * `VITE_` prefix makes it available to client-side code via Vite's env
 * replacement).
 *
 * @exports
 * - `signIn` — Authenticates with email/password. Used in `routes/login.tsx`.
 * - `signUp` — Registers a new user with name/email/password/role. Used in
 *   `routes/register.tsx`.
 * - `signOut` — Destroys the session and clears the cookie. Used in the
 *   Sidebar component.
 * - `useSession` — React hook that returns the current session (available but
 *   not the primary session access method; most pages get the session from
 *   route context via `_authed.tsx`'s `beforeLoad`).
 *
 * @see `lib/auth.ts` for the server-side auth configuration.
 * @see `lib/auth-server.ts` for server-side session helpers.
 * @see `docs/uml/sequence-diagrams.md` §1–2 for registration/login flows.
 */
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
