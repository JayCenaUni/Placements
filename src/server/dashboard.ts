import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
  placement,
  application,
  review,
  managerAssignment,
  apprenticeProfile,
  user,
  apprenticeRequest,
} from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

export const getApprenticeDashboard = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const profile = await db.query.apprenticeProfile.findFirst({
      where: eq(apprenticeProfile.userId, userId),
    });

    const currentPlacement = profile?.currentPlacementId
      ? await db.query.placement.findFirst({
          where: eq(placement.id, profile.currentPlacementId),
        })
      : null;

    const applications = await db
      .select()
      .from(application)
      .where(eq(application.apprenticeId, userId))
      .orderBy(sql`${application.appliedAt} DESC`)
      .limit(5);

    const applicationStats = await db
      .select({
        status: application.status,
        count: count(),
      })
      .from(application)
      .where(eq(application.apprenticeId, userId))
      .groupBy(application.status);

    const openPlacements = await db
      .select({ count: count() })
      .from(placement)
      .where(eq(placement.status, "open"));

    return {
      profile,
      currentPlacement,
      recentApplications: applications,
      applicationStats: Object.fromEntries(
        applicationStats.map((s) => [s.status, s.count])
      ),
      openPlacementsCount: openPlacements[0]?.count ?? 0,
    };
  });

export const getApprenticeManagerDashboard = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const assignments = await db
      .select({
        apprentice: user,
        profile: apprenticeProfile,
      })
      .from(managerAssignment)
      .innerJoin(user, eq(managerAssignment.apprenticeId, user.id))
      .leftJoin(apprenticeProfile, eq(user.id, apprenticeProfile.userId))
      .where(eq(managerAssignment.managerId, userId));

    const apprenticeIds = assignments.map((a) => a.apprentice.id);

    let pendingApplications: (typeof application.$inferSelect & {
      apprenticeName: string;
      placementTitle: string;
    })[] = [];

    if (apprenticeIds.length > 0) {
      const apps = await db
        .select({
          application: application,
          apprenticeName: user.name,
          placementTitle: placement.title,
        })
        .from(application)
        .innerJoin(user, eq(application.apprenticeId, user.id))
        .innerJoin(placement, eq(application.placementId, placement.id))
        .where(
          and(
            eq(application.status, "pending"),
            sql`${application.apprenticeId} IN (${sql.join(
              apprenticeIds.map((id) => sql`${id}`),
              sql`, `
            )})`
          )
        );

      pendingApplications = apps.map((a) => ({
        ...a.application,
        apprenticeName: a.apprenticeName,
        placementTitle: a.placementTitle,
      }));
    }

    const placed = assignments.filter((a) => a.profile?.currentPlacementId).length;
    const unplaced = assignments.length - placed;

    return {
      totalApprentices: assignments.length,
      placed,
      unplaced,
      pendingApplicationsCount: pendingApplications.length,
      pendingApplications: pendingApplications.slice(0, 5),
      apprentices: assignments.map((a) => ({
        id: a.apprentice.id,
        name: a.apprentice.name,
        email: a.apprentice.email,
        hasPlacement: !!a.profile?.currentPlacementId,
      })),
    };
  });

export const getPlacementManagerDashboard = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const listings = await db
      .select()
      .from(placement)
      .where(eq(placement.placementManagerId, userId))
      .orderBy(sql`${placement.createdAt} DESC`);

    const activeListings = listings.filter(
      (p) => p.status === "open" || p.status === "draft"
    );

    const placementIds = listings.map((p) => p.id);

    let totalApplications = 0;
    let recentReviews: {
      id: string;
      rating: number;
      title: string | null;
      content: string;
      placementTitle: string;
      apprenticeName: string;
    }[] = [];

    if (placementIds.length > 0) {
      const appCount = await db
        .select({ count: count() })
        .from(application)
        .where(
          sql`${application.placementId} IN (${sql.join(
            placementIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );
      totalApplications = appCount[0]?.count ?? 0;

      const reviews = await db
        .select({
          review: review,
          placementTitle: placement.title,
          apprenticeName: user.name,
        })
        .from(review)
        .innerJoin(placement, eq(review.placementId, placement.id))
        .innerJoin(user, eq(review.apprenticeId, user.id))
        .where(
          sql`${review.placementId} IN (${sql.join(
            placementIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
        .orderBy(sql`${review.createdAt} DESC`)
        .limit(5);

      recentReviews = reviews.map((r) => ({
        id: r.review.id,
        rating: r.review.rating,
        title: r.review.title,
        content: r.review.content,
        placementTitle: r.placementTitle,
        apprenticeName: r.apprenticeName,
      }));
    }

    const openRequests = await db
      .select({ count: count() })
      .from(apprenticeRequest)
      .where(
        and(
          eq(apprenticeRequest.placementManagerId, userId),
          eq(apprenticeRequest.status, "open")
        )
      );

    return {
      totalListings: listings.length,
      activeListings: activeListings.length,
      totalApplications,
      openRequestsCount: openRequests[0]?.count ?? 0,
      listings: listings.slice(0, 5).map((p) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        department: p.department,
      })),
      recentReviews,
    };
  });
