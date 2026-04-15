/**
 * @file Placement detail page at `/placements/$placementId`.
 *
 * @description
 * Shows comprehensive detail for a single placement. The page adapts
 * significantly based on the viewer's role and relationship to the placement:
 *
 * - **All roles**: See the placement description, details sidebar (location,
 *   duration, dates, capacity), and manager contact info.
 *
 * - **Apprentices**: See a competency comparison section showing which
 *   competencies the placement develops, visually distinguishing achieved
 *   (green) vs gap (yellow) competencies. If the placement is "open" and
 *   the apprentice hasn't applied, an application form is shown.
 *
 * - **Placement owner** (the placement_manager who created it): Sees the
 *   applications list with links to review each one, and a "Manage" card
 *   to update the placement status.
 *
 * @data-loading
 * The loader fetches the placement (with applications and competencies) via
 * `getPlacement`, and for apprentices, also fetches their achieved competencies
 * via `getApprenticeCompetencies` to power the gap/achieved visual comparison.
 *
 * @application-flow
 * The `handleApply` function calls `applyToPlacement` which creates a new
 * application with "pending" status. The UI prevents duplicate applications
 * by checking `hasApplied` (derived from the placement's applications list).
 *
 * @status-management
 * The placement owner can change the status via a dropdown (draft/open/filled/
 * closed). This calls `updatePlacement` and refreshes the page.
 *
 * @see `docs/uml/sequence-diagrams.md` §4 for the application submission flow.
 * @see `docs/uml/state-diagrams.md` §1 for placement status transitions.
 */
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPlacement,
  applyToPlacement,
  updatePlacement,
} from "@/server/placements";
import { getApprenticeCompetencies } from "@/server/competencies";
import {
  Building2,
  MapPin,
  Clock,
  Calendar,
  Users,
  Mail,
  ArrowLeft,
  Award,
  CircleCheck,
  CircleAlert,
} from "lucide-react";

export const Route = createFileRoute("/_authed/placements/$placementId")({
  loader: async ({ params, context }) => {
    const placement = await getPlacement({ data: params.placementId });
    if (!placement) throw new Error("Placement not found");
    const achievedCompetencies =
      context.session.user.role === "apprentice"
        ? await getApprenticeCompetencies({ data: context.session.user.id })
        : [];
    return { placement, achievedCompetencies };
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
  const { placement, achievedCompetencies } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const achievedIds = new Set(achievedCompetencies.map((c) => c.id));
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

          {placement.competencies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" /> Competencies Developed
                </CardTitle>
                <CardDescription>
                  {isApprentice
                    ? "Competencies you can develop during this placement. Your achieved competencies are highlighted."
                    : "Competencies an apprentice can develop during this placement."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(["behavioural", "technical"] as const).map((cat) => {
                    const items = placement.competencies.filter((c) => c.category === cat);
                    if (items.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="mb-3 text-sm font-semibold capitalize">{cat}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {items.map((c) => {
                            const achieved = achievedIds.has(c.id);
                            return (
                              <div
                                key={c.id}
                                className={`rounded-lg border p-3 ${achieved ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}`}
                              >
                                <div className="flex items-center gap-2">
                                  {isApprentice && (
                                    achieved
                                      ? <CircleCheck className="h-4 w-4 shrink-0 text-green-600" />
                                      : <CircleAlert className="h-4 w-4 shrink-0 text-yellow-600" />
                                  )}
                                  <span className="text-sm font-medium">{c.name}</span>
                                  {isApprentice && (
                                    <Badge
                                      variant={achieved ? "success" : "warning"}
                                      className="ml-auto text-[10px] px-1.5 py-0"
                                    >
                                      {achieved ? "Achieved" : "Gap"}
                                    </Badge>
                                  )}
                                </div>
                                {c.description && (
                                  <p className={`mt-1.5 text-xs ${achieved ? "text-green-700" : "text-yellow-700"}`}>
                                    {c.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

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
                      <Select value={editStatus} onValueChange={(v) => setEditStatus(v as typeof editStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="filled">Filled</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
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
