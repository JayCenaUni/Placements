/**
 * @file Server functions for the role-specific dashboards.
 *
 * @description
 * Each of the three user roles sees a different dashboard at `/dashboard`.
 * The route loader in `routes/_authed/dashboard.tsx` inspects the session's
 * `user.role` and calls the corresponding server function from this file.
 * Each function aggregates data from multiple tables to build the dashboard
 * payload in a single round-trip.
 *
 * @architecture
 * These are TanStack Start **server functions** (`createServerFn`) that run
 * exclusively on the server. They accept a user ID, query the SQLite database
 * via Drizzle ORM, and return a typed JSON payload to the route component.
 *
 * @see `docs/uml/component-diagram.md` for where server functions sit in the
 *   overall architecture.
 * @see `docs/uml/sequence-diagrams.md` §7 for the apprentice manager dashboard
 *   data-loading flow.
 * @see `docs/uml/activity-diagram.md` §4 for the apprentice manager dashboard
 *   workflow.
 */
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
  placement,
  application,
  review,
  reviewCompetency,
  managerAssignment,
  apprenticeProfile,
  user,
  apprenticeRequest,
} from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

/**
 * Loads dashboard data for the **apprentice** role.
 *
 * @param userId — The authenticated apprentice's user ID.
 * @returns An object containing:
 *   - `currentPlacement` — The placement the apprentice is currently assigned
 *     to (resolved from `apprenticeProfile.currentPlacementId`), or null.
 *   - `recentApplications` — The 5 most recent applications submitted by this
 *     apprentice, ordered by `appliedAt` descending.
 *   - `applicationStats` — A status→count map (e.g. `{ pending: 2, approved: 1 }`)
 *     for all of the apprentice's applications.
 *   - `openPlacementsCount` — Total number of placements with status "open"
 *     across the system, shown as a call-to-action stat.
 */
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
      .select({
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt,
        placementId: application.placementId,
        placementTitle: placement.title,
        placementDepartment: placement.department,
      })
      .from(application)
      .innerJoin(placement, eq(application.placementId, placement.id))
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

/**
 * Loads dashboard data for the **apprentice_manager** role.
 *
 * This is the "Apprentice Locations" dashboard — the primary view for
 * apprentice managers. It shows a table of all managed apprentices with:
 * - Their current placement (title, department, and the placement manager's name)
 * - Their "desired next placement" (the first pending application they have)
 *
 * @param userId — The authenticated apprentice manager's user ID.
 * @returns An object containing:
 *   - `totalApprentices` — Count of apprentices assigned to this manager.
 *   - `activePlacements` — Count of distinct placements currently occupied by
 *     managed apprentices.
 *   - `pendingApplicationsCount` — Total pending applications across all
 *     managed apprentices.
 *   - `apprentices` — Array of apprentice objects, each with their current
 *     placement, the placement's manager name, and their desired next placement
 *     (derived from their first pending application).
 *
 * @query-strategy
 * The main query joins managerAssignment → user → apprenticeProfile → placement,
 * with an additional raw SQL self-join on the user table (aliased as `pm`) to
 * resolve the placement manager's name. A second query fetches all pending
 * applications for managed apprentices, then a Map groups them by apprenticeId
 * to pick each apprentice's first pending application as their "desired next".
 *
 * @see `docs/uml/sequence-diagrams.md` §7 for the full data flow.
 */
export const getApprenticeManagerDashboard = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    // Fetch all apprentices assigned to this manager, with their current
    // placement details and the placement manager's name (via raw SQL alias).
    const assignments = await db
      .select({
        apprentice: user,
        profile: apprenticeProfile,
        placementTitle: placement.title,
        placementDepartment: placement.department,
        placementId: placement.id,
        placementManagerName: sql<string | null>`pm.name`,
      })
      .from(managerAssignment)
      .innerJoin(user, eq(managerAssignment.apprenticeId, user.id))
      .leftJoin(apprenticeProfile, eq(user.id, apprenticeProfile.userId))
      .leftJoin(placement, eq(apprenticeProfile.currentPlacementId, placement.id))
      .leftJoin(
        sql`user as pm`,
        sql`pm.id = ${placement.placementManagerId}`
      )
      .where(eq(managerAssignment.managerId, userId));

    const apprenticeIds = assignments.map((a) => a.apprentice.id);

    // Fetch pending applications for all managed apprentices to determine
    // each apprentice's "desired next placement".
    let pendingApplications: {
      id: string;
      apprenticeId: string;
      apprenticeName: string;
      placementId: string;
      placementTitle: string;
    }[] = [];

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
        id: a.application.id,
        apprenticeId: a.application.apprenticeId,
        apprenticeName: a.apprenticeName,
        placementId: a.application.placementId,
        placementTitle: a.placementTitle,
      }));
    }

    // Group pending applications by apprentice, keeping only the first one
    // per apprentice as their "desired next placement" for the dashboard table.
    const pendingByApprentice = new Map<
      string,
      { placementId: string; placementTitle: string; applicationId: string }
    >();
    for (const app of pendingApplications) {
      if (!pendingByApprentice.has(app.apprenticeId)) {
        pendingByApprentice.set(app.apprenticeId, {
          placementId: app.placementId,
          placementTitle: app.placementTitle,
          applicationId: app.id,
        });
      }
    }

    const uniquePlacements = new Set(
      assignments
        .map((a) => a.placementId)
        .filter(Boolean)
    );

    return {
      totalApprentices: assignments.length,
      activePlacements: uniquePlacements.size,
      pendingApplicationsCount: pendingApplications.length,
      apprentices: assignments.map((a) => ({
        id: a.apprentice.id,
        name: a.apprentice.name,
        email: a.apprentice.email,
        currentPlacement: a.placementId
          ? {
              id: a.placementId,
              title: a.placementTitle!,
              department: a.placementDepartment!,
            }
          : null,
        placementManagerName: a.placementManagerName ?? null,
        desiredNextPlacement: pendingByApprentice.get(a.apprentice.id) ?? null,
      })),
    };
  });

/**
 * Loads dashboard data for the **placement_manager** role.
 *
 * @param userId — The authenticated placement manager's user ID.
 * @returns An object containing:
 *   - `totalListings` / `activeListings` — Counts of all and active (open/draft)
 *     placements owned by this manager.
 *   - `totalApplications` — Count of all applications across this manager's placements.
 *   - `openRequestsCount` — Count of apprentice requests with status "open".
 *   - `listings` — The 5 most recent placement listings (id, title, status, department).
 *   - `recentReviews` — The 5 most recent reviews on this manager's placements,
 *     including apprentice name and placement title.
 */
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
      placementTitle: string;
      apprenticeName: string;
      achievementSummary: {
        notAchieved: number;
        partiallyAchieved: number;
        fullyAchieved: number;
      };
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

      const reviewIds = reviews.map((r) => r.review.id);
      const reviewCompetencyRows = reviewIds.length
        ? await db
            .select({
              reviewId: reviewCompetency.reviewId,
              achievement: reviewCompetency.achievement,
            })
            .from(reviewCompetency)
            .where(
              sql`${reviewCompetency.reviewId} IN (${sql.join(
                reviewIds.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
        : [];

      const summaryByReview = new Map<
        string,
        { notAchieved: number; partiallyAchieved: number; fullyAchieved: number }
      >();
      for (const row of reviewCompetencyRows) {
        const current = summaryByReview.get(row.reviewId) ?? {
          notAchieved: 0,
          partiallyAchieved: 0,
          fullyAchieved: 0,
        };
        if (row.achievement === "not_achieved") current.notAchieved += 1;
        if (row.achievement === "partially_achieved") current.partiallyAchieved += 1;
        if (row.achievement === "fully_achieved") current.fullyAchieved += 1;
        summaryByReview.set(row.reviewId, current);
      }

      recentReviews = reviews.map((r) => ({
        id: r.review.id,
        placementTitle: r.placementTitle,
        apprenticeName: r.apprenticeName,
        achievementSummary: summaryByReview.get(r.review.id) ?? {
          notAchieved: 0,
          partiallyAchieved: 0,
          fullyAchieved: 0,
        },
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
