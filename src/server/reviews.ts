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
import {
  review,
  placement,
  user,
  application,
  placementCompetency,
  competency,
  reviewCompetency,
} from "@/db/schema";
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
    } else if (data.role === "placement_manager") {
      conditions = eq(placement.placementManagerId, data.userId);
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

    const reviewIds = results.map((r) => r.review.id);

    const competencyRatings = reviewIds.length
      ? await db
          .select({
            reviewId: reviewCompetency.reviewId,
            competencyId: competency.id,
            competencyName: competency.name,
            competencyCategory: competency.category,
            achievement: reviewCompetency.achievement,
          })
          .from(reviewCompetency)
          .innerJoin(competency, eq(reviewCompetency.competencyId, competency.id))
          .where(
            sql`${reviewCompetency.reviewId} IN (${sql.join(
              reviewIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
          .orderBy(competency.category, competency.name)
      : [];

    const competencyByReview = new Map<
      string,
      {
        competencyId: string;
        competencyName: string;
        competencyCategory: "behavioural" | "technical";
        achievement: "not_achieved" | "partially_achieved" | "fully_achieved";
      }[]
    >();
    for (const item of competencyRatings) {
      const current = competencyByReview.get(item.reviewId) ?? [];
      current.push({
        competencyId: item.competencyId,
        competencyName: item.competencyName,
        competencyCategory: item.competencyCategory,
        achievement: item.achievement,
      });
      competencyByReview.set(item.reviewId, current);
    }

    return results.map((r) => ({
      ...r.review,
      placementTitle: r.placementTitle,
      placementDepartment: r.placementDepartment,
      apprenticeName: r.apprenticeName,
      competencies: competencyByReview.get(r.review.id) ?? [],
    }));
  });

/**
 * Fetches one review with competency details, enforcing role-based visibility.
 *
 * - Apprentices can only view their own reviews.
 * - Apprentice managers and placement managers can view any review.
 */
export const getReviewById = createServerFn({ method: "GET" })
  .inputValidator((input: { reviewId: string; userId: string; role: string }) => input)
  .handler(async ({ data }) => {
    let conditions = eq(review.id, data.reviewId);
    if (data.role === "apprentice") {
      conditions = and(eq(review.id, data.reviewId), eq(review.apprenticeId, data.userId))!;
    } else if (data.role === "placement_manager") {
      conditions = and(eq(review.id, data.reviewId), eq(placement.placementManagerId, data.userId))!;
    }

    const result = await db
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
      .limit(1);

    if (result.length === 0) return null;

    const competencyRatings = await db
      .select({
        competencyId: competency.id,
        competencyName: competency.name,
        competencyCategory: competency.category,
        achievement: reviewCompetency.achievement,
      })
      .from(reviewCompetency)
      .innerJoin(competency, eq(reviewCompetency.competencyId, competency.id))
      .where(eq(reviewCompetency.reviewId, data.reviewId))
      .orderBy(competency.category, competency.name);

    return {
      ...result[0].review,
      placementTitle: result[0].placementTitle,
      placementDepartment: result[0].placementDepartment,
      apprenticeName: result[0].apprenticeName,
      competencies: competencyRatings,
    };
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
        placementDepartment: placement.department,
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
    const reviewablePlacements = approvedApps.filter((p) => !reviewedIds.has(p.placementId));
    const placementIds = reviewablePlacements.map((p) => p.placementId);

    const competencies = placementIds.length
      ? await db
          .select({
            placementId: placementCompetency.placementId,
            competencyId: competency.id,
            competencyName: competency.name,
            competencyCategory: competency.category,
          })
          .from(placementCompetency)
          .innerJoin(competency, eq(placementCompetency.competencyId, competency.id))
          .where(
            sql`${placementCompetency.placementId} IN (${sql.join(
              placementIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
          .orderBy(competency.category, competency.name)
      : [];

    const competenciesByPlacement = new Map<
      string,
      {
        competencyId: string;
        competencyName: string;
        competencyCategory: "behavioural" | "technical";
      }[]
    >();
    for (const item of competencies) {
      const current = competenciesByPlacement.get(item.placementId) ?? [];
      current.push({
        competencyId: item.competencyId,
        competencyName: item.competencyName,
        competencyCategory: item.competencyCategory,
      });
      competenciesByPlacement.set(item.placementId, current);
    }

    return reviewablePlacements.map((p) => ({
      ...p,
      competencies: competenciesByPlacement.get(p.placementId) ?? [],
    }));
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
      competencyRatings: {
        competencyId: string;
        achievement: "not_achieved" | "partially_achieved" | "fully_achieved";
      }[];
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

    const offeredCompetencies = await db
      .select({ competencyId: placementCompetency.competencyId })
      .from(placementCompetency)
      .where(eq(placementCompetency.placementId, data.placementId));

    const offeredIds = new Set(offeredCompetencies.map((c) => c.competencyId));
    if (offeredIds.size === 0) {
      throw new Error("This placement has no competencies configured to review.");
    }

    const providedIds = new Set(data.competencyRatings.map((c) => c.competencyId));
    if (providedIds.size !== offeredIds.size) {
      throw new Error("Please rate every competency offered by this placement.");
    }
    for (const offeredId of offeredIds) {
      if (!providedIds.has(offeredId)) {
        throw new Error("Please rate every competency offered by this placement.");
      }
    }

    const id = crypto.randomUUID();
    await db.insert(review).values({
      id,
      apprenticeId: data.apprenticeId,
      placementId: data.placementId,
    });
    await db.insert(reviewCompetency).values(
      data.competencyRatings.map((item) => ({
        reviewId: id,
        competencyId: item.competencyId,
        achievement: item.achievement,
      }))
    );
    return { id };
  });
