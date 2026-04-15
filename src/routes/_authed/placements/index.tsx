import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listPlacements } from "@/server/placements";
import { listPlacementsWithGaps } from "@/server/competencies";
import { Building2, MapPin, Clock, Plus, Users, CalendarArrowDown, Target } from "lucide-react";

type SortMode = "date" | "gaps";

export const Route = createFileRoute("/_authed/placements/")({
  validateSearch: (search: Record<string, unknown>): { sort?: SortMode } => ({
    sort: search.sort === "gaps" ? "gaps" : undefined,
  }),
  loaderDeps: ({ search }) => ({ sort: search.sort }),
  loader: async ({ context, deps }) => {
    const isApprentice = context.session.user.role === "apprentice";
    const useGaps = isApprentice && deps.sort === "gaps";

    if (useGaps) {
      const placements = await listPlacementsWithGaps({
        data: { apprenticeId: context.session.user.id },
      });
      return { placements, sort: "gaps" as const };
    }

    const placements = await listPlacements({ data: {} });
    return {
      placements: placements.map((p) => ({ ...p, gapCount: undefined as number | undefined })),
      sort: "date" as const,
    };
  },
  component: PlacementsListPage,
});

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  open: "success",
  draft: "secondary",
  filled: "default",
  closed: "destructive",
};

function PlacementsListPage() {
  const { placements, sort } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const isPlacementManager = session.user.role === "placement_manager";
  const isApprentice = session.user.role === "apprentice";

  const setSort = (mode: SortMode) => {
    navigate({
      to: "/placements",
      search: mode === "gaps" ? { sort: "gaps" } : {},
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Placements</h2>
          <p className="text-muted-foreground">
            {isPlacementManager
              ? "Manage your placement listings"
              : "Browse available placement opportunities"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isApprentice && (
            <div className="flex rounded-md border">
              <Button
                variant={sort === "date" ? "default" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setSort("date")}
              >
                <CalendarArrowDown className="mr-1.5 h-3.5 w-3.5" />
                Date
              </Button>
              <Button
                variant={sort === "gaps" ? "default" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setSort("gaps")}
              >
                <Target className="mr-1.5 h-3.5 w-3.5" />
                Competency Gaps
              </Button>
            </div>
          )}
          {isPlacementManager && (
            <Button asChild>
              <Link to="/placements/new">
                <Plus className="mr-2 h-4 w-4" /> New Placement
              </Link>
            </Button>
          )}
        </div>
      </div>

      {placements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No placements found</p>
            <p className="text-sm text-muted-foreground">
              {isPlacementManager
                ? "Create your first placement listing to get started."
                : "Check back later for new opportunities."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {placements.map((p) => (
            <Link
              key={p.id}
              to="/placements/$placementId"
              params={{ placementId: p.id }}
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{p.title}</CardTitle>
                    <Badge variant={statusVariant[p.status] ?? "default"}>
                      {p.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" /> {p.department}
                    </span>
                    {p.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {p.location}
                      </span>
                    )}
                    {p.durationWeeks && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {p.durationWeeks} weeks
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> {p.applicationCount} applicants
                    </span>
                  </div>
                  {sort === "gaps" && p.gapCount != null && p.gapCount > 0 && (
                    <div className="pt-1">
                      <Badge variant="warning">
                        <Target className="mr-1 h-3 w-3" />
                        {p.gapCount} competency {p.gapCount === 1 ? "gap" : "gaps"}
                      </Badge>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Posted by {p.managerName}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
