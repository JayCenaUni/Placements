/**
 * @file Server functions for application listing, detail, and review (approve/deny).
 *
 * @description
 * Manages the application lifecycle from listing through to approval/denial.
 * The key business rule is the **approval side effect**: when an application is
 * approved, the apprentice's profile is automatically updated to point to the
 * new placement (see `reviewApplication` below and `docs/uml/state-diagrams.md`
 * §2 "Approval Side Effect").
 *
 * @access-control
 * Application visibility is role-scoped:
 * - **Apprentices** see only their own applications.
 * - **Apprentice managers** see applications for their managed apprentices
 *   (determined by `managerAssignment`).
 * - **Placement managers** see applications on their own placements.
 *
 * @see `docs/uml/sequence-diagrams.md` §5 for the review application flow.
 * @see `docs/uml/state-diagrams.md` §2 for application status transitions.
 */
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
  application,
  placement,
  user,
  managerAssignment,
  apprenticeProfile,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Lists applications scoped by the caller's role.
 *
 * The role parameter drives three distinct query paths:
 * - "apprentice": Returns applications where `apprenticeId` matches the caller.
 * - "apprentice_manager": Looks up managed apprentice IDs via `managerAssignment`,
 *   then returns applications for those apprentices.
 * - "placement_manager": Returns applications on placements owned by the caller.
 *
 * All paths join to the placement and user tables to enrich the response with
 * placement title/department and apprentice name.
 */
export const listApplications = createServerFn({ method: "GET" })
  .inputValidator((input: { userId: string; role: string }) => input)
  .handler(async ({ data }) => {
    if (data.role === "apprentice") {
      const results = await db
        .select({
          application: application,
          placementTitle: placement.title,
          placementDepartment: placement.department,
        })
        .from(application)
        .innerJoin(placement, eq(application.placementId, placement.id))
        .where(eq(application.apprenticeId, data.userId))
        .orderBy(sql`${application.appliedAt} DESC`);

      return results.map((r) => ({
        ...r.application,
        placementTitle: r.placementTitle,
        placementDepartment: r.placementDepartment,
        apprenticeName: "",
      }));
    }

    if (data.role === "apprentice_manager") {
      const managedIds = await db
        .select({ apprenticeId: managerAssignment.apprenticeId })
        .from(managerAssignment)
        .where(eq(managerAssignment.managerId, data.userId));

      const ids = managedIds.map((m) => m.apprenticeId);
      if (ids.length === 0) return [];

      const results = await db
        .select({
          application: application,
          placementTitle: placement.title,
          placementDepartment: placement.department,
          apprenticeName: user.name,
        })
        .from(application)
        .innerJoin(placement, eq(application.placementId, placement.id))
        .innerJoin(user, eq(application.apprenticeId, user.id))
        .where(
          sql`${application.apprenticeId} IN (${sql.join(
            ids.map((id) => sql`${id}`),
            sql`, `
          )})`
        )
        .orderBy(sql`${application.appliedAt} DESC`);

      return results.map((r) => ({
        ...r.application,
        placementTitle: r.placementTitle,
        placementDepartment: r.placementDepartment,
        apprenticeName: r.apprenticeName,
      }));
    }

    if (data.role === "placement_manager") {
      const results = await db
        .select({
          application: application,
          placementTitle: placement.title,
          placementDepartment: placement.department,
          apprenticeName: user.name,
        })
        .from(application)
        .innerJoin(placement, eq(application.placementId, placement.id))
        .innerJoin(user, eq(application.apprenticeId, user.id))
        .where(eq(placement.placementManagerId, data.userId))
        .orderBy(sql`${application.appliedAt} DESC`);

      return results.map((r) => ({
        ...r.application,
        placementTitle: r.placementTitle,
        placementDepartment: r.placementDepartment,
        apprenticeName: r.apprenticeName,
      }));
    }

    return [];
  });

/**
 * Fetches a single application by ID with full context: placement details,
 * apprentice identity, and the apprentice's profile (skills, department).
 *
 * Used by the application detail page (`/applications/$applicationId`) to
 * display the application alongside applicant information for reviewers.
 */
export const getApplication = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db
      .select({
        application: application,
        placementTitle: placement.title,
        placementDepartment: placement.department,
        placementDescription: placement.description,
        apprenticeName: user.name,
        apprenticeEmail: user.email,
      })
      .from(application)
      .innerJoin(placement, eq(application.placementId, placement.id))
      .innerJoin(user, eq(application.apprenticeId, user.id))
      .where(eq(application.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const r = result[0];

    const profile = await db.query.apprenticeProfile.findFirst({
      where: eq(apprenticeProfile.userId, r.application.apprenticeId),
    });

    return {
      ...r.application,
      placementTitle: r.placementTitle,
      placementDepartment: r.placementDepartment,
      placementDescription: r.placementDescription,
      apprenticeName: r.apprenticeName,
      apprenticeEmail: r.apprenticeEmail,
      apprenticeProfile: profile ?? null,
    };
  });

/**
 * Approves or denies a pending application.
 *
 * This is the critical mutation in the application lifecycle. It:
 * 1. Updates the application's status, reviewedBy, and reviewedAt fields.
 * 2. **If approved**: Executes the "Approval Side Effect" — updates (or
 *    creates) the apprentice's profile to set `currentPlacementId` to the
 *    approved placement. This is what assigns the apprentice to their new
 *    placement in the system.
 *
 * Only apprentice_managers should call this (enforced by the UI's `canReview`
 * check in `routes/_authed/applications/$applicationId.tsx`).
 *
 * @see `docs/uml/sequence-diagrams.md` §5 for the full review flow.
 * @see `docs/uml/state-diagrams.md` §2 "Approval Side Effect" for the
 *   profile update logic.
 */
export const reviewApplication = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { applicationId: string; status: "approved" | "denied"; reviewedBy: string }) =>
      input
  )
  .handler(async ({ data }) => {
    await db
      .update(application)
      .set({
        status: data.status,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(application.id, data.applicationId));

    // Approval Side Effect: assign the apprentice to the placement by
    // updating (or creating) their apprenticeProfile.currentPlacementId.
    if (data.status === "approved") {
      const app = await db.query.application.findFirst({
        where: eq(application.id, data.applicationId),
      });
      if (app) {
        const existingProfile = await db.query.apprenticeProfile.findFirst({
          where: eq(apprenticeProfile.userId, app.apprenticeId),
        });
        if (existingProfile) {
          await db
            .update(apprenticeProfile)
            .set({ currentPlacementId: app.placementId })
            .where(eq(apprenticeProfile.userId, app.apprenticeId));
        } else {
          await db.insert(apprenticeProfile).values({
            userId: app.apprenticeId,
            currentPlacementId: app.placementId,
          });
        }
      }
    }

    return { success: true };
  });
