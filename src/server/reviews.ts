import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { review, placement, user, application } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const listReviews = createServerFn({ method: "GET" })
  .inputValidator((input: { userId: string; role: string }) => input)
  .handler(async ({ data }) => {
    let conditions;

    if (data.role === "apprentice") {
      conditions = eq(review.apprenticeId, data.userId);
    }

    const results = await db
      .select({
        review: review,
        placementTitle: placement.title,
        placementDepartment: placement.department,
        apprenticeName: user.name,
      })
      .from(review)
      .innerJoin(placement, eq(review.placementId, placement.id))
      .innerJoin(user, eq(review.apprenticeId, user.id))
      .where(conditions)
      .orderBy(sql`${review.createdAt} DESC`);

    return results.map((r) => ({
      ...r.review,
      placementTitle: r.placementTitle,
      placementDepartment: r.placementDepartment,
      apprenticeName: r.apprenticeName,
    }));
  });

export const getReviewablePlacements = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const approvedApps = await db
      .select({
        placementId: application.placementId,
        placementTitle: placement.title,
      })
      .from(application)
      .innerJoin(placement, eq(application.placementId, placement.id))
      .where(
        and(
          eq(application.apprenticeId, userId),
          eq(application.status, "approved")
        )
      );

    const existingReviews = await db
      .select({ placementId: review.placementId })
      .from(review)
      .where(eq(review.apprenticeId, userId));

    const reviewedIds = new Set(existingReviews.map((r) => r.placementId));

    return approvedApps.filter((p) => !reviewedIds.has(p.placementId));
  });

export const createReview = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      apprenticeId: string;
      placementId: string;
      rating: number;
      title?: string;
      content: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select()
      .from(review)
      .where(
        and(
          eq(review.apprenticeId, data.apprenticeId),
          eq(review.placementId, data.placementId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("You have already reviewed this placement.");
    }

    const id = crypto.randomUUID();
    await db.insert(review).values({
      id,
      apprenticeId: data.apprenticeId,
      placementId: data.placementId,
      rating: data.rating,
      title: data.title ?? null,
      content: data.content,
    });
    return { id };
  });
