/**
 * @file Create placement page at `/placements/new`.
 *
 * @description
 * Form page for placement managers to create new placement listings. Access
 * is restricted to the `placement_manager` role via a `beforeLoad` guard —
 * other roles are redirected to the dashboard.
 *
 * @form-fields
 * - Title, Description, Department (required)
 * - Location, Duration, Start/End dates, Capacity (optional)
 * - Initial status: "draft" (not visible to others) or "open" (accepting
 *   applications)
 *
 * On successful creation, the user is navigated to the new placement's detail
 * page. The server function validates input via a Zod schema before insertion.
 *
 * @see `docs/uml/sequence-diagrams.md` §6 for the create placement flow.
 * @see `docs/uml/state-diagrams.md` §1 — new placements default to "draft".
 */
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPlacement } from "@/server/placements";

export const Route = createFileRoute("/_authed/placements/new")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "placement_manager") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: NewPlacementPage,
});

function NewPlacementPage() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      const result = await createPlacement({
        data: {
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          department: formData.get("department") as string,
          location: (formData.get("location") as string) || undefined,
          durationWeeks: formData.get("durationWeeks")
            ? Number(formData.get("durationWeeks"))
            : undefined,
          startDate: (formData.get("startDate") as string) || undefined,
          endDate: (formData.get("endDate") as string) || undefined,
          capacity: Number(formData.get("capacity")) || 1,
          status: formData.get("status") as "draft" | "open",
          placementManagerId: session.user.id,
        },
      });
      navigate({
        to: "/placements/$placementId",
        params: { placementId: result.id },
      });
    } catch {
      setError("Failed to create placement. Please check your input.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-3xl font-bold">Create Placement</h2>

      <Card>
        <CardHeader>
          <CardTitle>Placement Details</CardTitle>
          <CardDescription>
            Fill in the details for your new placement listing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" required placeholder="e.g. Software Engineering Placement" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                required
                rows={5}
                placeholder="Describe the placement, responsibilities, and what the apprentice will learn..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Input id="department" name="department" required placeholder="e.g. Engineering" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="e.g. London, Remote" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="durationWeeks">Duration (weeks)</Label>
                <Input id="durationWeeks" name="durationWeeks" type="number" min={1} placeholder="12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" name="capacity" type="number" min={1} defaultValue={1} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Initial status</Label>
                <Select name="status" defaultValue="draft">
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft (not visible)</SelectItem>
                    <SelectItem value="open">Open (visible and accepting applications)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Placement"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/placements" })}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
