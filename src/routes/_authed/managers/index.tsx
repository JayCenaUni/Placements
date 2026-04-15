/**
 * @file Placement manager directory page at `/managers`.
 *
 * @description
 * A read-only directory listing all users with the `placement_manager` role,
 * along with their email and the count of placements they own. This gives
 * apprentice managers a way to find and contact placement managers.
 *
 * @access-control
 * Restricted to `apprentice_manager` role via `beforeLoad` guard. This page
 * does not appear in the sidebar for other roles.
 *
 * @see `docs/uml/use-case-diagram.md` — "View Manager Assignments" is an
 *   apprentice_manager-only use case.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { listPlacementManagers } from "@/server/managers";
import { UserCog, Mail, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authed/managers/")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "apprentice_manager") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async () => {
    const managers = await listPlacementManagers();
    return { managers };
  },
  component: ManagersListPage,
});

function ManagersListPage() {
  const { managers } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Placement Managers</h2>
        <p className="text-muted-foreground">
          Directory of placement managers and their contact information
        </p>
      </div>

      {managers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCog className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No managers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {managers.map((m) => (
            <Card key={m.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${m.email}`} className="hover:underline">
                        {m.email}
                      </a>
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  <span>{m.placementCount} placement{m.placementCount !== 1 ? "s" : ""}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
