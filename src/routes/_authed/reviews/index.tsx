/**
 * @file Reviews listing page at `/reviews`.
 *
 * @description
 * Displays placement reviews. Apprentices see only their own reviews;
 * other roles see all reviews in the system. Each review card shows the
 * placement title, star rating, content excerpt, and the reviewing
 * apprentice's name.
 *
 * Apprentices also get a "Write Review" button linking to `/reviews/new`.
 *
 * @see `server/reviews.ts` for the role-scoped listing logic.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listReviews } from "@/server/reviews";
import { ListChecks, Plus } from "lucide-react";

export const Route = createFileRoute("/_authed/reviews/")({
  loader: async ({ context }) => {
    const reviews = await listReviews({
      data: { userId: context.session.user.id, role: context.session.user.role },
    });
    return { reviews };
  },
  component: ReviewsListPage,
});

const achievementMeta: Record<
  "not_achieved" | "partially_achieved" | "fully_achieved",
  { label: string; className: string; dotClass: string }
> = {
  not_achieved: {
    label: "Not achieved",
    className: "border-red-200 bg-red-50 text-red-700",
    dotClass: "bg-red-600",
  },
  partially_achieved: {
    label: "Partially achieved",
    className: "border-orange-200 bg-orange-50 text-orange-700",
    dotClass: "bg-orange-500",
  },
  fully_achieved: {
    label: "Fully achieved",
    className: "border-green-200 bg-green-50 text-green-700",
    dotClass: "bg-green-600",
  },
};

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
            <ListChecks className="mx-auto h-12 w-12 text-muted-foreground" />
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
                    <CardTitle className="text-lg">{r.placementTitle}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {r.placementDepartment}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {r.competencies.map((item) => {
                    const meta = achievementMeta[item.achievement];
                    return (
                      <div
                        key={item.competencyId}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <p className="text-sm font-medium">{item.competencyName}</p>
                        <Badge variant="outline" className={meta.className}>
                          <span className={`mr-1.5 h-2 w-2 rounded-full ${meta.dotClass}`} />
                          {meta.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
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
