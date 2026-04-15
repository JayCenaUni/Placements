/**
 * @file Authenticated layout route — pathless layout wrapping all protected pages.
 *
 * @description
 * This is a TanStack Router **pathless layout route** (`_authed.tsx`). The
 * underscore prefix means it does not add a URL segment — routes like
 * `/dashboard`, `/placements`, etc. are children of this layout but their
 * URLs don't include `_authed`. Its purpose is to:
 *
 * 1. **Enforce authentication**: The `beforeLoad` hook calls `getSession()`
 *    (a server function) to validate the session cookie. If the session is
 *    null (not logged in or expired), the user is redirected to `/login`.
 *
 * 2. **Provide session context**: On successful auth, the session object is
 *    returned from `beforeLoad` and becomes available to all child routes via
 *    `Route.useRouteContext()`. This is how child routes access `session.user.id`,
 *    `session.user.role`, and `session.user.name` without making additional
 *    auth checks.
 *
 * 3. **Render the app shell**: The component renders the Sidebar (which
 *    adapts its navigation items to the user's role) alongside a main content
 *    area that contains the `<Outlet />` for child route rendering.
 *
 * @architecture
 * Route hierarchy:
 *   __root.tsx → _authed.tsx → (dashboard | profile | placements/* | applications/* | ...)
 *
 * The session is validated once here and then trusted by all child routes.
 * Child routes that need additional role checks do so in their own `beforeLoad`
 * (e.g. `placements/new.tsx` ensures only placement_managers can access it).
 *
 * @see `docs/uml/sequence-diagrams.md` §3 for the authentication guard flow.
 * @see `docs/uml/component-diagram.md` for how the route layer interacts
 *   with auth helpers.
 */
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Sidebar } from "@/components/sidebar";
import { getSession } from "@/lib/auth-server";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async () => {
    const session = await getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
  component: AuthedLayout,
});

/**
 * App shell layout: sidebar navigation + scrollable main content area.
 *
 * The session is pulled from route context (set by `beforeLoad` above) and
 * passed to the Sidebar for role-based nav item filtering and user display.
 */
function AuthedLayout() {
  const { session } = Route.useRouteContext();

  return (
    <div className="flex h-screen">
      <Sidebar
        userName={session.user.name}
        userRole={session.user.role as "apprentice" | "apprentice_manager" | "placement_manager"}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
