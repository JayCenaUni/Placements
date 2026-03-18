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
