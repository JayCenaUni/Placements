/**
 * @file Better Auth API catch-all route — handles `/api/auth/*` requests.
 *
 * @description
 * This is a TanStack Start **server-only route** that uses the `$` (splat)
 * segment to match any sub-path under `/api/auth/`. All incoming GET and POST
 * requests are forwarded to Better Auth's `auth.handler()`, which is a
 * standards-based request/response handler that processes:
 *
 * - `POST /api/auth/sign-up/email` — User registration
 * - `POST /api/auth/sign-in/email` — User login
 * - `POST /api/auth/sign-out` — Session destruction
 * - `GET /api/auth/get-session` — Session validation
 * - And other Better Auth internal endpoints.
 *
 * The client-side auth SDK (`lib/auth-client.ts`) calls these endpoints
 * automatically. The `auth.handler` reads/writes the auth tables (user,
 * session, account, verification) via the Drizzle adapter configured in
 * `lib/auth.ts`.
 *
 * @see `docs/uml/sequence-diagrams.md` §1–2 for how these endpoints are
 *   called during registration and login.
 */
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return auth.handler(request);
      },
      POST: async ({ request }) => {
        return auth.handler(request);
      },
    },
  },
});
