/**
 * @file Better Auth server-side configuration.
 *
 * @description
 * Initialises the Better Auth instance that handles all authentication
 * operations: user registration, login, password hashing (bcrypt), session
 * creation/validation, and cookie management. This is a **server-only** module
 * — it must never be imported in client-side code.
 *
 * @architecture
 * Better Auth acts as a self-contained auth server. It is wired to the
 * application database via the Drizzle adapter, reading and writing the four
 * auth tables defined in `db/schema.ts` (user, session, account, verification).
 *
 * The `auth.handler` method is mounted as an HTTP handler at `/api/auth/*`
 * (see `routes/api/auth/$.ts`) to serve login/signup/signout API requests
 * from the client-side auth SDK (`lib/auth-client.ts`).
 *
 * The `auth.api.getSession` method is used server-side by `getSession()` and
 * `ensureSession()` in `lib/auth-server.ts` to validate session cookies
 * during route loading (see `docs/uml/sequence-diagrams.md` §3).
 *
 * @custom-fields
 * The `role` field is added to the user table via `additionalFields`. This
 * makes it part of the signup payload (clients send `role` during registration)
 * and includes it in the session object (so route guards and components can
 * read `session.user.role` without an extra DB lookup).
 *
 * @session-config
 * - `expiresIn`: 7 days — how long a session token is valid.
 * - `updateAge`: 1 day — Better Auth refreshes the session expiry if the
 *   session is accessed after this interval, implementing sliding expiration.
 *
 * @consumers
 * - `routes/api/auth/$.ts` — mounts `auth.handler` for HTTP auth endpoints.
 * - `lib/auth-server.ts` — uses `auth.api.getSession` for session validation.
 * - `db/seed.ts` — uses `auth.api.signUpEmail` to create test users.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "apprentice",
        input: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

/** Inferred session type including the user object with the custom `role` field. */
export type Session = typeof auth.$Infer.Session;
