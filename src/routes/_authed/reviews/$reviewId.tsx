import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getReviewById } from "@/server/reviews";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authed/reviews/$reviewId")({
  loader: async ({ context, params }) => {
    const review = await getReviewById({
      data: {
        reviewId: params.reviewId,
        userId: context.session.user.id,
        role: context.session.user.role,
      },
    });
    if (!review) {
      throw new Error("Review not found");
    }
    return { review };
  },
  component: ReviewDetailPage,
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

function ReviewDetailPage() {
  const { review } = Route.useLoaderData();

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/reviews">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to reviews
        </Link>
      </Button>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{review.placementTitle}</CardTitle>
          <p className="text-xs text-muted-foreground">{review.placementDepartment}</p>
          <p className="text-[11px] text-muted-foreground">
            by {review.apprenticeName} &middot;{" "}
            {new Date(review.createdAt).toLocaleDateString("en-GB")}
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {review.competencies.map((item) => {
              const meta = achievementMeta[item.achievement];
              return (
                <div
                  key={item.competencyId}
                  className="flex items-center justify-between rounded-md border px-2.5 py-2"
                >
                  <div>
                    <p className="text-xs font-medium">{item.competencyName}</p>
                    <p className="text-[11px] capitalize text-muted-foreground">
                      {item.competencyCategory}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${meta.className} px-1.5 py-0 text-[11px]`}>
                    <span className={`mr-1.5 h-2 w-2 rounded-full ${meta.dotClass}`} />
                    {meta.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
