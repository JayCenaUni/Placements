import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getApprentice } from "@/server/apprentices";
import { ArrowLeft, Mail, Building2, Phone, User } from "lucide-react";

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

        <Card>
          <CardHeader>
            <CardTitle>Placement Status</CardTitle>
          </CardHeader>
          <CardContent>
            {apprentice.currentPlacementTitle ? (
              <div>
                <Badge variant="success" className="mb-2">Placed</Badge>
                <p className="font-medium">{apprentice.currentPlacementTitle}</p>
              </div>
            ) : (
              <div>
                <Badge variant="warning" className="mb-2">Unplaced</Badge>
                <p className="text-sm text-muted-foreground">
                  This apprentice is not currently assigned to a placement.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
