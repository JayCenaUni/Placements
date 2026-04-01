import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getApprenticeDashboard,
  getApprenticeManagerDashboard,
  getPlacementManagerDashboard,
} from "@/server/dashboard";
import {
  Building2,
  FileText,
  Users,
  Plus,
  Star,
  ArrowRight,
  Send,
  MoveRight,
  MapPin,
} from "lucide-react";

export const Route = createFileRoute("/_authed/dashboard")({
  loader: async ({ context }) => {
    const role = context.session.user.role;
    const userId = context.session.user.id;

    if (role === "apprentice") {
      return { role, data: await getApprenticeDashboard({ data: userId }) };
    } else if (role === "apprentice_manager") {
      return { role, data: await getApprenticeManagerDashboard({ data: userId }) };
    } else {
      return { role, data: await getPlacementManagerDashboard({ data: userId }) };
    }
  },
  component: DashboardPage,
});

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  approved: "success",
  denied: "destructive",
  withdrawn: "secondary",
  open: "success",
  draft: "secondary",
  filled: "default",
  closed: "destructive",
};

type ApprenticeData = Awaited<ReturnType<typeof getApprenticeDashboard>>;
type AMData = Awaited<ReturnType<typeof getApprenticeManagerDashboard>>;
type PMData = Awaited<ReturnType<typeof getPlacementManagerDashboard>>;

function DashboardPage() {
  const { role, data } = Route.useLoaderData();

  if (role === "apprentice") return <ApprenticeDashboard data={data as ApprenticeData} />;
  if (role === "apprentice_manager") return <ApprenticeManagerDashboard data={data as AMData} />;
  return <PlacementManagerDashboard data={data as PMData} />;
}

function ApprenticeDashboard({ data }: { data: ApprenticeData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Placement</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.currentPlacement ? (
              <div>
                <p className="text-2xl font-bold">{data.currentPlacement.title}</p>
                <p className="text-xs text-muted-foreground">{data.currentPlacement.department}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No active placement</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Object.values(data.applicationStats).reduce((a, b) => a + b, 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {data.applicationStats.pending ?? 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Placements</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.openPlacementsCount}</p>
            <Link to="/placements" className="text-xs text-primary hover:underline">
              Browse placements
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Your latest placement applications</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentApplications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No applications yet.</p>
              <Button asChild className="mt-4">
                <Link to="/placements">Browse placements</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{app.placementId}</p>
                    <p className="text-xs text-muted-foreground">
                      Applied {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={statusVariant[app.status] ?? "default"}>
                    {app.status}
                  </Badge>
                </div>
              ))}
              <Button variant="ghost" asChild className="w-full">
                <Link to="/applications">
                  View all applications <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ApprenticeManagerDashboard({ data }: { data: AMData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Apprentice Locations</h2>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Apprentices</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totalApprentices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Placements</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.activePlacements}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.pendingApplicationsCount}</p>
            <Link to="/applications" className="text-xs text-primary hover:underline">
              Review applications
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apprentice Placement Overview</CardTitle>
          <CardDescription>
            Where each apprentice is currently placed and where they wish to go next
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.apprentices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No apprentices assigned yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Apprentice</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Current Placement</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Placement Manager</th>
                    <th className="pb-3 pr-4 font-medium text-muted-foreground">Desired Next Placement</th>
                    <th className="pb-3 font-medium text-muted-foreground"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.apprentices.map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          to="/apprentices/$apprenticeId"
                          params={{ apprenticeId: a.id }}
                          className="hover:underline"
                        >
                          <p className="font-medium">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.email}</p>
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        {a.currentPlacement ? (
                          <Link
                            to="/placements/$placementId"
                            params={{ placementId: a.currentPlacement.id }}
                            className="hover:underline"
                          >
                            <p className="font-medium">{a.currentPlacement.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {a.currentPlacement.department}
                            </p>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {a.placementManagerName ? (
                          <span>{a.placementManagerName}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {a.desiredNextPlacement ? (
                          <div className="flex items-center gap-2">
                            <MoveRight className="h-4 w-4 shrink-0 text-primary" />
                            <Link
                              to="/placements/$placementId"
                              params={{ placementId: a.desiredNextPlacement.placementId }}
                              className="font-medium text-primary hover:underline"
                            >
                              {a.desiredNextPlacement.placementTitle}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No application</span>
                        )}
                      </td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            to="/apprentices/$apprenticeId"
                            params={{ apprenticeId: a.id }}
                          >
                            View <ArrowRight className="ml-1 h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlacementManagerDashboard({ data }: { data: PMData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Placement Dashboard</h2>
        <Button asChild>
          <Link to="/placements/new">
            <Plus className="mr-2 h-4 w-4" /> New Placement
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totalListings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{data.activeListings}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.totalApplications}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.openRequestsCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Placements</CardTitle>
            <CardDescription>Your placement listings</CardDescription>
          </CardHeader>
          <CardContent>
            {data.listings.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">No placements yet.</p>
                <Button asChild className="mt-2" size="sm">
                  <Link to="/placements/new">Create your first placement</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.listings.map((p) => (
                  <Link
                    key={p.id}
                    to="/placements/$placementId"
                    params={{ placementId: p.id }}
                    className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                  >
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.department}</p>
                    </div>
                    <Badge variant={statusVariant[p.status] ?? "default"}>
                      {p.status}
                    </Badge>
                  </Link>
                ))}
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/placements">
                    View all <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>Latest reviews on your placements</CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentReviews.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No reviews yet.
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentReviews.map((r) => (
                  <div key={r.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{r.placementTitle}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{r.rating}/5</span>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {r.apprenticeName}
                    </p>
                    <p className="mt-1 text-sm line-clamp-2">{r.content}</p>
                  </div>
                ))}
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/reviews">
                    View all reviews <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
