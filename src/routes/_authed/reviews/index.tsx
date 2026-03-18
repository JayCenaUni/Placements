import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listReviews } from "@/server/reviews";
import { Star, Plus } from "lucide-react";

export const Route = createFileRoute("/_authed/reviews/")({
  loader: async ({ context }) => {
    const reviews = await listReviews({
      data: { userId: context.session.user.id, role: context.session.user.role },
    });
    return { reviews };
  },
  component: ReviewsListPage,
});

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewsListPage() {
  const { reviews } = Route.useLoaderData();
  const { session } = Route.useRouteContext();
  const isApprentice = session.user.role === "apprentice";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Reviews</h2>
          <p className="text-muted-foreground">
            {isApprentice ? "Your placement reviews" : "Placement feedback from apprentices"}
          </p>
        </div>
        {isApprentice && (
          <Button asChild>
            <Link to="/reviews/new">
              <Plus className="mr-2 h-4 w-4" /> Write Review
            </Link>
          </Button>
        )}
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No reviews yet</p>
            <p className="text-sm text-muted-foreground">
              {isApprentice
                ? "Complete a placement to leave a review."
                : "No reviews have been submitted yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {r.title || r.placementTitle}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {r.placementTitle} &middot; {r.placementDepartment}
                    </p>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{r.content}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  by {r.apprenticeName} &middot;{" "}
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
