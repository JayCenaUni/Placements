/**
 * @file Server functions for placement reviews.
 *
 * @description
 * Handles listing, eligibility checking, and creation of placement reviews.
 * Reviews are feedback submitted by apprentices about placements they have
 * completed (i.e. placements where they had an approved application). Each
 * apprentice can review a given placement only once.
 *
 * @business-rules
 * - Only apprentices can create reviews (enforced by the `beforeLoad` guard
 *   in `routes/_authed/reviews/new.tsx`).
 * - An apprentice can only review placements where they have an approved
 *   application AND have not already submitted a review. The eligible set is
 *   computed by `getReviewablePlacements`.
 * - Duplicate review prevention is enforced in `createReview` with a DB check.
 *
 * @see `docs/uml/sequence-diagrams.md` §9 for the review submission flow.
 * @see `docs/uml/activity-diagram.md` §2 for the review workflow.
 */
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { review, placement, user, application } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Lists reviews, optionally scoped by role.
 *
 * - Apprentices see only their own reviews.
 * - Apprentice managers and placement managers see all reviews (no filter).
 *
 * Each review is enriched with the placement title/department and the
 * reviewing apprentice's name.
 */
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

/**
 * Computes which placements an apprentice is eligible to review.
 *
 * The eligible set is: placements with an approved application by this
 * apprentice, minus placements they have already reviewed. This ensures the
 * review form's placement dropdown only shows valid options.
 *
 * @see `docs/uml/sequence-diagrams.md` §9 — "Reviewable placements
 *   (approved minus reviewed)".
 */
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

/**
 * Creates a new review for a placement.
 *
 * Enforces the one-review-per-apprentice-per-placement rule with a duplicate
 * check before insertion. Throws an error if a duplicate is found.
 */
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
