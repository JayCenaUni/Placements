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
