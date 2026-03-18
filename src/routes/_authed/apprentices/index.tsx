import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listApprentices } from "@/server/apprentices";
import { Users, Mail, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authed/apprentices/")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role === "apprentice") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async ({ context }) => {
    const apprentices = await listApprentices({
      data: { userId: context.session.user.id, role: context.session.user.role },
    });
    return { apprentices };
  },
  component: ApprenticesListPage,
});

function ApprenticesListPage() {
  const { apprentices } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const isManager = session.user.role === "apprentice_manager";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Apprentices</h2>
        <p className="text-muted-foreground">
          {isManager
            ? "Your managed apprentices"
            : "Browse apprentice profiles"}
        </p>
      </div>

      {apprentices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No apprentices found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {apprentices.map((a) => (
            <Link
              key={a.id}
              to="/apprentices/$apprenticeId"
              params={{ apprenticeId: a.id }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {a.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" /> {a.email}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {a.department && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {a.department}
                      </p>
                    )}
                    {a.cohort && (
                      <p className="text-xs text-muted-foreground">{a.cohort}</p>
                    )}
                    <div className="pt-1">
                      <Badge variant={a.currentPlacementTitle ? "success" : "warning"}>
                        {a.currentPlacementTitle || "Unplaced"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
