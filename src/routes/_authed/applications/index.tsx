import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listApplications } from "@/server/applications";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authed/applications/")({
  loader: async ({ context }) => {
    const apps = await listApplications({
      data: { userId: context.session.user.id, role: context.session.user.role },
    });
    return { applications: apps };
  },
  component: ApplicationsListPage,
});

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  approved: "success",
  denied: "destructive",
  withdrawn: "secondary",
};

function ApplicationsListPage() {
  const { applications } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const isApprentice = session.user.role === "apprentice";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Applications</h2>
        <p className="text-muted-foreground">
          {isApprentice
            ? "Track your placement applications"
            : "Review and manage placement applications"}
        </p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No applications</p>
            <p className="text-sm text-muted-foreground">
              {isApprentice
                ? "You haven't applied to any placements yet."
                : "No applications to review at this time."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Link
              key={app.id}
              to="/applications/$applicationId"
              params={{ applicationId: app.id }}
            >
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="space-y-1">
                    <p className="font-medium">{app.placementTitle}</p>
                    <p className="text-sm text-muted-foreground">{app.placementDepartment}</p>
                    {!isApprentice && app.apprenticeName && (
                      <p className="text-sm text-muted-foreground">
                        Applicant: {app.apprenticeName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={statusVariant[app.status] ?? "default"}>
                    {app.status}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
