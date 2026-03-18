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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { createRequest, getManagerPlacements } from "@/server/requests";

export const Route = createFileRoute("/_authed/requests/new")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "placement_manager") {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: async ({ context }) => {
    const placements = await getManagerPlacements({
      data: context.session.user.id,
    });
    return { placements };
  },
  component: NewRequestPage,
});

function NewRequestPage() {
  const { placements } = Route.useLoaderData();
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
      await createRequest({
        data: {
          placementManagerId: session.user.id,
          placementId: formData.get("placementId") as string,
          message: (formData.get("message") as string) || undefined,
        },
      });
      navigate({ to: "/requests" });
    } catch {
      setError("Failed to create request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-3xl font-bold">New Apprentice Request</h2>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Request an apprentice for one of your placements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {placements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You need to create a placement first before making a request.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="placementId">Placement</Label>
                <Select id="placementId" name="placementId" required>
                  <option value="">Select a placement...</option>
                  {placements.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="Describe what kind of apprentice you're looking for, preferred skills, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Submit Request"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: "/requests" })}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
