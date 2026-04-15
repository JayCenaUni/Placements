/**
 * @file Root index route — redirect-only entry point at `/`.
 *
 * @description
 * This route has no component; it exists solely to redirect users to the
 * appropriate starting page based on their authentication state:
 * - Authenticated users → `/dashboard` (which then shows a role-specific view)
 * - Unauthenticated users → `/login`
 *
 * The redirect happens in `beforeLoad` (server-side, before any rendering)
 * so users never see a blank page. TanStack Router's `redirect()` throws a
 * redirect response which the framework catches and sends as an HTTP 302.
 *
 * @see `docs/uml/activity-diagram.md` §5 for the authentication flow.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession } from "@/lib/auth-server";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
    throw redirect({ to: "/login" });
  },
});
