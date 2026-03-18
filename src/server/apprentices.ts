import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
  user,
  apprenticeProfile,
  managerAssignment,
  placement,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";

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

    // Placement managers can see all apprentices
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

export const getApprentice = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db
      .select({
        user: user,
        profile: apprenticeProfile,
        currentPlacementTitle: placement.title,
      })
      .from(user)
      .leftJoin(apprenticeProfile, eq(user.id, apprenticeProfile.userId))
      .leftJoin(placement, eq(apprenticeProfile.currentPlacementId, placement.id))
      .where(eq(user.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const r = result[0];
    return {
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
      role: r.user.role,
      profile: r.profile,
      currentPlacementTitle: r.currentPlacementTitle ?? null,
    };
  });

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
