import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getApplication, reviewApplication } from "@/server/applications";
import { ArrowLeft, Mail, Building2, User } from "lucide-react";

export const Route = createFileRoute("/_authed/applications/$applicationId")({
  loader: async ({ params }) => {
    const application = await getApplication({ data: params.applicationId });
    if (!application) throw new Error("Application not found");
    return { application };
  },
  component: ApplicationDetailPage,
});

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  approved: "success",
  denied: "destructive",
  withdrawn: "secondary",
};

function ApplicationDetailPage() {
  const { application } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const canReview =
    session.user.role === "apprentice_manager" && application.status === "pending";

  const handleReview = async (status: "approved" | "denied") => {
    setLoading(true);
    try {
      await reviewApplication({
        data: {
          applicationId: application.id,
          status,
          reviewedBy: session.user.id,
        },
      });
      navigate({ to: "/applications" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/applications">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to applications
        </Link>
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">Application Details</h2>
          <p className="mt-1 text-muted-foreground">
            Application for {application.placementTitle}
          </p>
        </div>
        <Badge
          variant={statusVariant[application.status] ?? "default"}
          className="text-sm"
        >
          {application.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Placement</CardTitle>
              <CardDescription>{application.placementDepartment}</CardDescription>
            </CardHeader>
            <CardContent>
              <h3 className="mb-2 text-lg font-semibold">
                <Link
                  to="/placements/$placementId"
                  params={{ placementId: application.placementId }}
                  className="hover:underline"
                >
                  {application.placementTitle}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {application.placementDescription}
              </p>
            </CardContent>
          </Card>

          {application.coverMessage && (
            <Card>
              <CardHeader>
                <CardTitle>Cover Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{application.coverMessage}</p>
              </CardContent>
            </Card>
          )}

          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Review Application</CardTitle>
                <CardDescription>
                  Approve or deny this placement application
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Button
                  onClick={() => handleReview("approved")}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Processing..." : "Approve"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview("denied")}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Deny"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applicant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Link
                  to="/apprentices/$apprenticeId"
                  params={{ apprenticeId: application.apprenticeId }}
                  className="font-medium hover:underline"
                >
                  {application.apprenticeName}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{application.apprenticeEmail}</span>
              </div>
              {application.apprenticeProfile && (
                <>
                  {application.apprenticeProfile.department && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{application.apprenticeProfile.department}</span>
                    </div>
                  )}
                  {application.apprenticeProfile.skills && (
                    <div>
                      <p className="mb-1 font-medium">Skills</p>
                      <p className="text-muted-foreground">
                        {application.apprenticeProfile.skills}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="font-medium">Applied</p>
                <p className="text-muted-foreground">
                  {new Date(application.appliedAt).toLocaleString()}
                </p>
              </div>
              {application.reviewedAt && (
                <div>
                  <p className="font-medium">Reviewed</p>
                  <p className="text-muted-foreground">
                    {new Date(application.reviewedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
