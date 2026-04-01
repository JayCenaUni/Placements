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
import { getApprentice } from "@/server/apprentices";
import { ArrowLeft, Building2, Phone, User, Clock, MoveRight } from "lucide-react";

export const Route = createFileRoute("/_authed/apprentices/$apprenticeId")({
  loader: async ({ params }) => {
    const apprentice = await getApprentice({ data: params.apprenticeId });
    if (!apprentice) throw new Error("Apprentice not found");
    return { apprentice };
  },
  component: ApprenticeDetailPage,
});

function ApprenticeDetailPage() {
  const { apprentice } = Route.useLoaderData();

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/apprentices">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to apprentices
        </Link>
      </Button>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
          {apprentice.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-3xl font-bold">{apprentice.name}</h2>
          <p className="text-muted-foreground">{apprentice.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {apprentice.profile ? (
              <>
                {apprentice.profile.department && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Department</p>
                      <p className="text-sm text-muted-foreground">
                        {apprentice.profile.department}
                      </p>
                    </div>
                  </div>
                )}
                {apprentice.profile.cohort && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Cohort</p>
                      <p className="text-sm text-muted-foreground">
                        {apprentice.profile.cohort}
                      </p>
                    </div>
                  </div>
                )}
                {apprentice.profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {apprentice.profile.phone}
                      </p>
                    </div>
                  </div>
                )}
                {apprentice.profile.bio && (
                  <div>
                    <p className="text-sm font-medium">Bio</p>
                    <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                      {apprentice.profile.bio}
                    </p>
                  </div>
                )}
                {apprentice.profile.skills && (
                  <div>
                    <p className="text-sm font-medium">Skills</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {apprentice.profile.skills.split(",").map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill.trim()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This apprentice hasn't set up their profile yet.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Placement</CardTitle>
            </CardHeader>
            <CardContent>
              {apprentice.currentPlacementTitle ? (
                <div className="space-y-1">
                  <p className="font-medium">{apprentice.currentPlacementTitle}</p>
                  {apprentice.currentPlacementDepartment && (
                    <p className="text-sm text-muted-foreground">
                      {apprentice.currentPlacementDepartment}
                    </p>
                  )}
                  {apprentice.placementManagerName && (
                    <p className="text-sm text-muted-foreground">
                      Managed by {apprentice.placementManagerName}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No active placement.
                </p>
              )}
            </CardContent>
          </Card>

          {apprentice.pendingApplications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Desired Next Placement</CardTitle>
                <CardDescription>
                  Where this apprentice has applied to go next
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {apprentice.pendingApplications.map((app) => (
                    <div key={app.applicationId} className="flex items-center gap-2">
                      <MoveRight className="h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">{app.placementTitle}</p>
                        <p className="text-xs text-muted-foreground">
                          Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Placement History</CardTitle>
          <CardDescription>
            Previous and current placements for this apprentice
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apprentice.placementHistory.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No placement history recorded yet.
            </p>
          ) : (
            <div className="relative space-y-0">
              {apprentice.placementHistory.map((entry, i) => (
                <div key={`${entry.placementId}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < apprentice.placementHistory.length - 1 && (
                    <div className="absolute left-[11px] top-6 h-full w-px bg-border" />
                  )}
                  <div className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
                    {i === 0 ? (
                      <Building2 className="h-3 w-3 text-primary" />
                    ) : (
                      <Clock className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{entry.placementTitle}</p>
                    <p className="text-sm text-muted-foreground">{entry.department}</p>
                    {entry.approvedAt && (
                      <p className="text-xs text-muted-foreground">
                        Approved {new Date(entry.approvedAt).toLocaleDateString()}
                      </p>
                    )}
                    {i === 0 && apprentice.currentPlacementTitle === entry.placementTitle && (
                      <Badge variant="success" className="mt-1">Current</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
