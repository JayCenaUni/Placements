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
import { Select } from "@/components/ui/select";
import { getReviewablePlacements, createReview } from "@/server/reviews";
import { Star } from "lucide-react";

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
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    try {
      await createReview({
        data: {
          apprenticeId: session.user.id,
          placementId: formData.get("placementId") as string,
          rating,
          title: (formData.get("title") as string) || undefined,
          content: formData.get("content") as string,
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
            <Star className="mx-auto h-12 w-12 text-muted-foreground" />
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
            Share your experience to help other apprentices.
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
              <Select id="placementId" name="placementId" required>
                <option value="">Select a placement...</option>
                {placements.map((p) => (
                  <option key={p.placementId} value={p.placementId}>
                    {p.placementTitle}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHoverRating(i)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="rounded p-1 transition-colors hover:bg-accent"
                    aria-label={`${i} star${i > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        i <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {rating}/5
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                name="title"
                placeholder="Sum up your experience..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Review *</Label>
              <Textarea
                id="content"
                name="content"
                required
                rows={5}
                placeholder="Share what you learned, what went well, and any suggestions..."
              />
            </div>

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
