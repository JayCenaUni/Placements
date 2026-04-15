/**
 * @file New review page at `/reviews/new`.
 *
 * @description
 * Form page for apprentices to submit reviews of completed placements. Access
 * is restricted to the `apprentice` role via a `beforeLoad` guard.
 *
 * @eligibility
 * The loader calls `getReviewablePlacements` which returns placements where
 * the apprentice has an approved application AND hasn't already submitted a
 * review. If no placements are eligible, an informational message is shown
 * instead of the form.
 *
 * @form
 * - Placement selection dropdown (populated from eligible placements)
 * - Interactive star rating (1–5, with hover preview)
 * - Optional title
 * - Required review content
 *
 * On submission, `createReview` checks for duplicates server-side before
 * inserting. Success navigates back to `/reviews`.
 *
 * @see `docs/uml/sequence-diagrams.md` §9 for the review submission flow.
 * @see `docs/uml/activity-diagram.md` §2 for the review workflow.
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getReviewablePlacements, createReview } from "@/server/reviews";
import { ListChecks } from "lucide-react";

export const Route = createFileRoute("/_authed/reviews/new")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "apprentice") {
      throw redirect({ to: "/reviews" });
    }
  },
  loader: async ({ context }) => {
    const placements = await getReviewablePlacements({
      data: context.session.user.id,
    });
    return { placements };
  },
  component: NewReviewPage,
});

function NewReviewPage() {
  const { placements } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [placementId, setPlacementId] = useState(placements[0]?.placementId ?? "");
  const [competencyRatings, setCompetencyRatings] = useState<
    Record<string, "not_achieved" | "partially_achieved" | "fully_achieved">
  >({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const selectedPlacement = placements.find((p) => p.placementId === placementId);
    if (!selectedPlacement) return;

    const missingRatings = selectedPlacement.competencies.some(
      (c) => !competencyRatings[c.competencyId]
    );
    if (missingRatings) {
      setError("Please rate every competency for this placement.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createReview({
        data: {
          apprenticeId: session.user.id,
          placementId,
          competencyRatings: selectedPlacement.competencies.map((c) => ({
            competencyId: c.competencyId,
            achievement: competencyRatings[c.competencyId],
          })),
        },
      });
      navigate({ to: "/reviews" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (placements.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h2 className="text-3xl font-bold">Write a Review</h2>
        <Card>
          <CardContent className="py-12 text-center">
            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No placements to review</p>
            <p className="text-sm text-muted-foreground">
              You can only review placements you've been approved for and haven't
              reviewed yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-3xl font-bold">Write a Review</h2>

      <Card>
        <CardHeader>
          <CardTitle>Placement Review</CardTitle>
          <CardDescription>
            Review each offered competency as not achieved, partially achieved, or fully achieved.
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
              <Label htmlFor="placementId">Placement</Label>
              <Select
                value={placementId}
                onValueChange={(value) => {
                  setPlacementId(value);
                  setCompetencyRatings({});
                }}
                required
              >
                <SelectTrigger id="placementId">
                  <SelectValue placeholder="Select a placement..." />
                </SelectTrigger>
                <SelectContent>
                  {placements.map((p) => (
                    <SelectItem key={p.placementId} value={p.placementId}>
                      {p.placementTitle} - {p.placementDepartment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {placements
              .find((p) => p.placementId === placementId)
              ?.competencies.map((item) => (
                <div key={item.competencyId} className="space-y-2">
                  <Label>{item.competencyName}</Label>
                  <Select
                    value={competencyRatings[item.competencyId]}
                    onValueChange={(value) =>
                      setCompetencyRatings((current) => ({
                        ...current,
                        [item.competencyId]: value as
                          | "not_achieved"
                          | "partially_achieved"
                          | "fully_achieved",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select achievement level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_achieved">Not achieved</SelectItem>
                      <SelectItem value="partially_achieved">Partially achieved</SelectItem>
                      <SelectItem value="fully_achieved">Fully achieved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate({ to: "/reviews" })}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
