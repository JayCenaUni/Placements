/**
 * @file Server functions for apprentice profiles and directory.
 *
 * @description
 * Provides data access for the apprentice directory (`/apprentices`), individual
 * apprentice detail pages (`/apprentices/$apprenticeId`), and the user's own
 * profile page (`/profile`). Also handles profile updates for apprentices.
 *
 * @access-control
 * - `listApprentices` and `getApprentice`: Accessible to apprentice_manager and
 *   placement_manager roles. Apprentices are redirected away by the route guard.
 * - Apprentice managers see only their managed apprentices (filtered by
 *   `managerAssignment`). Placement managers see all apprentice-role users.
 * - `getProfile` and `updateProfile`: Accessible to the authenticated user
 *   for their own profile.
 *
 * @see `docs/uml/sequence-diagrams.md` §8 for the apprentice detail data flow.
 * @see `docs/uml/use-case-diagram.md` for role-based access to these features.
 */
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
  user,
  apprenticeProfile,
  managerAssignment,
  placement,
  application,
  apprenticeCompetency,
  competency,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Lists apprentices scoped by the caller's role.
 *
 * - **apprentice_manager**: Queries `managerAssignment` to find assigned
 *   apprentices, then joins profile and current placement data.
 * - **placement_manager**: Queries all users with role "apprentice", with
 *   profile and current placement data.
 *
 * Returns a flat object per apprentice suitable for card-based rendering.
 */
export const listApprentices = createServerFn({ method: "GET" })
  .inputValidator((input: { userId: string; role: string }) => input)
  .handler(async ({ data }) => {
    if (data.role === "apprentice_manager") {
      const results = await db
        .select({
          user: user,
          profile: apprenticeProfile,
          currentPlacementTitle: placement.title,
        })
        .from(managerAssignment)
        .innerJoin(user, eq(managerAssignment.apprenticeId, user.id))
        .leftJoin(apprenticeProfile, eq(user.id, apprenticeProfile.userId))
        .leftJoin(placement, eq(apprenticeProfile.currentPlacementId, placement.id))
        .where(eq(managerAssignment.managerId, data.userId));

      return results.map((r) => ({
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        department: r.profile?.department ?? null,
        cohort: r.profile?.cohort ?? null,
        skills: r.profile?.skills ?? null,
        currentPlacementTitle: r.currentPlacementTitle ?? null,
      }));
    }

    // Placement managers see all apprentice-role users (not filtered by assignment).
    const results = await db
      .select({
        user: user,
        profile: apprenticeProfile,
        currentPlacementTitle: placement.title,
      })
      .from(user)
      .leftJoin(apprenticeProfile, eq(user.id, apprenticeProfile.userId))
      .leftJoin(placement, eq(apprenticeProfile.currentPlacementId, placement.id))
      .where(eq(user.role, "apprentice"));

    return results.map((r) => ({
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
      department: r.profile?.department ?? null,
      cohort: r.profile?.cohort ?? null,
      skills: r.profile?.skills ?? null,
      currentPlacementTitle: r.currentPlacementTitle ?? null,
    }));
  });

/**
 * Fetches full detail for a single apprentice.
 *
 * Aggregates data from multiple tables to build the apprentice detail view:
 * - User info and profile (department, cohort, bio, skills, phone)
 * - Current placement title/department and the placement manager's name
 *   (resolved via a raw SQL self-join alias "pm" on the user table)
 * - Achieved competencies (from `apprenticeCompetency` join `competency`)
 * - Placement history: all approved applications ordered by review date descending
 * - Pending applications: "desired next placements" for the manager's view
 *
 * @see `docs/uml/sequence-diagrams.md` §8 for the data flow.
 */
export const getApprentice = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    // Main query: user + profile + current placement + placement manager name.
    // The raw SQL `user as pm` alias resolves the placement manager's name
    // from the same user table without a schema-level self-referential join.
    const result = await db
      .select({
        user: user,
        profile: apprenticeProfile,
        currentPlacementTitle: placement.title,
        currentPlacementDepartment: placement.department,
        placementManagerName: sql<string | null>`pm.name`,
      })
      .from(user)
      .leftJoin(apprenticeProfile, eq(user.id, apprenticeProfile.userId))
      .leftJoin(placement, eq(apprenticeProfile.currentPlacementId, placement.id))
      .leftJoin(
        sql`user as pm`,
        sql`pm.id = ${placement.placementManagerId}`
      )
      .where(eq(user.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const r = result[0];

    const approvedApps = await db
      .select({
        application: application,
        placementTitle: placement.title,
        placementDepartment: placement.department,
      })
      .from(application)
      .innerJoin(placement, eq(application.placementId, placement.id))
      .where(
        and(
          eq(application.apprenticeId, id),
          eq(application.status, "approved")
        )
      )
      .orderBy(sql`${application.reviewedAt} DESC`);

    const pendingApps = await db
      .select({
        application: application,
        placementTitle: placement.title,
      })
      .from(application)
      .innerJoin(placement, eq(application.placementId, placement.id))
      .where(
        and(
          eq(application.apprenticeId, id),
          eq(application.status, "pending")
        )
      )
      .orderBy(sql`${application.appliedAt} DESC`);

    const competencies = await db
      .select({
        id: competency.id,
        name: competency.name,
        category: competency.category,
        description: competency.description,
        achievedAt: apprenticeCompetency.achievedAt,
      })
      .from(apprenticeCompetency)
      .innerJoin(competency, eq(apprenticeCompetency.competencyId, competency.id))
      .where(eq(apprenticeCompetency.apprenticeId, id))
      .orderBy(competency.category, competency.name);

    return {
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
      role: r.user.role,
      profile: r.profile,
      currentPlacementTitle: r.currentPlacementTitle ?? null,
      currentPlacementDepartment: r.currentPlacementDepartment ?? null,
      placementManagerName: r.placementManagerName ?? null,
      competencies,
      placementHistory: approvedApps.map((a) => ({
        placementId: a.application.placementId,
        placementTitle: a.placementTitle,
        department: a.placementDepartment,
        approvedAt: a.application.reviewedAt,
      })),
      pendingApplications: pendingApps.map((a) => ({
        applicationId: a.application.id,
        placementTitle: a.placementTitle,
        appliedAt: a.application.appliedAt,
      })),
    };
  });

/**
 * Fetches the current user's profile data (user record + apprentice profile).
 *
 * Used by the `/profile` page for all roles. The apprentice profile may be
 * null if the user hasn't set one up yet or if the user is not an apprentice.
 */
export const getProfile = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const u = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    const profile = await db.query.apprenticeProfile.findFirst({
      where: eq(apprenticeProfile.userId, userId),
    });
    return { user: u, profile: profile ?? null };
  });

/**
 * Creates or updates the apprentice profile for the given user.
 *
 * Uses an upsert pattern: if a profile already exists, it updates the fields;
 * if not, it inserts a new profile row. This handles the case where an
 * apprentice edits their profile for the first time.
 */
export const updateProfile = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      userId: string;
      department?: string;
      cohort?: string;
      bio?: string;
      skills?: string;
      phone?: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const existing = await db.query.apprenticeProfile.findFirst({
      where: eq(apprenticeProfile.userId, data.userId),
    });

    const values = {
      department: data.department ?? null,
      cohort: data.cohort ?? null,
      bio: data.bio ?? null,
      skills: data.skills ?? null,
      phone: data.phone ?? null,
    };

    if (existing) {
      await db
        .update(apprenticeProfile)
        .set(values)
        .where(eq(apprenticeProfile.userId, data.userId));
    } else {
      await db.insert(apprenticeProfile).values({
        userId: data.userId,
        ...values,
      });
    }

    return { success: true };
  });
