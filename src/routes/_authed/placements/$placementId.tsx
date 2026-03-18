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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  getPlacement,
  applyToPlacement,
  updatePlacement,
} from "@/server/placements";
import {
  Building2,
  MapPin,
  Clock,
  Calendar,
  Users,
  Mail,
  ArrowLeft,
} from "lucide-react";

export const Route = createFileRoute("/_authed/placements/$placementId")({
  loader: async ({ params }) => {
    const placement = await getPlacement({ data: params.placementId });
    if (!placement) throw new Error("Placement not found");
    return { placement };
  },
  component: PlacementDetailPage,
});

const statusVariant: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  open: "success",
  draft: "secondary",
  filled: "default",
  closed: "destructive",
  pending: "warning",
  approved: "success",
  denied: "destructive",
  withdrawn: "secondary",
};

function PlacementDetailPage() {
  const { placement } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const role = session.user.role;
  const isOwner = placement.placementManagerId === session.user.id;
  const isApprentice = role === "apprentice";

  const hasApplied = placement.applications.some(
    (a) => a.apprenticeId === session.user.id
  );

  const [coverMessage, setCoverMessage] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState(placement.status);

  const handleApply = async () => {
    setApplyLoading(true);
    setApplyError("");
    try {
      await applyToPlacement({
        data: {
          apprenticeId: session.user.id,
          placementId: placement.id,
          coverMessage: coverMessage || undefined,
        },
      });
      setApplySuccess(true);
    } catch (err: unknown) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplyLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    await updatePlacement({
      data: { id: placement.id, status: editStatus as "draft" | "open" | "filled" | "closed" },
    });
    navigate({ to: "/placements/$placementId", params: { placementId: placement.id } });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/placements">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to placements
        </Link>
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold">{placement.title}</h2>
          <p className="mt-1 text-muted-foreground">{placement.department}</p>
        </div>
        <Badge variant={statusVariant[placement.status] ?? "default"} className="text-sm">
          {placement.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{placement.description}</p>
            </CardContent>
          </Card>

          {isApprentice && placement.status === "open" && (
            <Card>
              <CardHeader>
                <CardTitle>Apply</CardTitle>
                <CardDescription>Submit your application for this placement</CardDescription>
              </CardHeader>
              <CardContent>
                {applySuccess ? (
                  <div className="rounded-md bg-green-50 p-4 text-green-800">
                    Application submitted successfully!
                  </div>
                ) : hasApplied ? (
                  <div className="rounded-md bg-muted p-4 text-muted-foreground">
                    You have already applied to this placement.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applyError && (
                      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {applyError}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="coverMessage">Cover message (optional)</Label>
                      <Textarea
                        id="coverMessage"
                        placeholder="Tell the placement manager why you're interested..."
                        value={coverMessage}
                        onChange={(e) => setCoverMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleApply} disabled={applyLoading}>
                      {applyLoading ? "Submitting..." : "Submit Application"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle>Applications ({placement.applications.length})</CardTitle>
                <CardDescription>People who have applied to this placement</CardDescription>
              </CardHeader>
              <CardContent>
                {placement.applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {placement.applications.map((app) => (
                      <Link
                        key={app.id}
                        to="/applications/$applicationId"
                        params={{ applicationId: app.id }}
                        className="flex items-center justify-between rounded-md border p-3 hover:bg-accent"
                      >
                        <div>
                          <p className="font-medium">{app.apprenticeName}</p>
                          {app.coverMessage && (
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                              {app.coverMessage}
                            </p>
                          )}
                        </div>
                        <Badge variant={statusVariant[app.status] ?? "default"}>
                          {app.status}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {placement.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{placement.location}</span>
                </div>
              )}
              {placement.durationWeeks && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{placement.durationWeeks} weeks</span>
                </div>
              )}
              {placement.startDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Starts {placement.startDate}</span>
                </div>
              )}
              {placement.endDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Ends {placement.endDate}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Capacity: {placement.capacity}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Placement Manager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{placement.managerName}</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${placement.managerEmail}`} className="text-primary hover:underline">
                  {placement.managerEmail}
                </a>
              </div>
            </CardContent>
          </Card>

          {isOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Manage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {editing ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="draft">Draft</option>
                        <option value="open">Open</option>
                        <option value="filled">Filled</option>
                        <option value="closed">Closed</option>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleStatusUpdate}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setEditing(true)}>
                    Edit Status
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
