import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { placement, application, user } from "@/db/schema";
import { eq, sql, and, count } from "drizzle-orm";
import { z } from "zod/v4";

export const listPlacements = createServerFn({ method: "GET" })
  .inputValidator((input: { status?: string }) => input)
  .handler(async ({ data }) => {
    const conditions = data.status
      ? eq(placement.status, data.status as "draft" | "open" | "filled" | "closed")
      : undefined;

    const results = await db
      .select({
        placement: placement,
        managerName: user.name,
        applicationCount: count(application.id),
      })
      .from(placement)
      .leftJoin(user, eq(placement.placementManagerId, user.id))
      .leftJoin(application, eq(placement.id, application.placementId))
      .where(conditions)
      .groupBy(placement.id)
      .orderBy(sql`${placement.createdAt} DESC`);

    return results.map((r) => ({
      ...r.placement,
      managerName: r.managerName ?? "Unknown",
      applicationCount: r.applicationCount,
    }));
  });

export const getPlacement = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }) => {
    const result = await db
      .select({
        placement: placement,
        managerName: user.name,
        managerEmail: user.email,
      })
      .from(placement)
      .leftJoin(user, eq(placement.placementManagerId, user.id))
      .where(eq(placement.id, id))
      .limit(1);

    if (result.length === 0) return null;

    const applications = await db
      .select({
        application: application,
        apprenticeName: user.name,
      })
      .from(application)
      .innerJoin(user, eq(application.apprenticeId, user.id))
      .where(eq(application.placementId, id))
      .orderBy(sql`${application.appliedAt} DESC`);

    return {
      ...result[0].placement,
      managerName: result[0].managerName ?? "Unknown",
      managerEmail: result[0].managerEmail ?? "",
      applications: applications.map((a) => ({
        ...a.application,
        apprenticeName: a.apprenticeName,
      })),
    };
  });

const createPlacementSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  department: z.string().min(1),
  location: z.string().optional(),
  durationWeeks: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.number().int().positive().default(1),
  status: z.enum(["draft", "open"]).default("draft"),
  placementManagerId: z.string(),
});

export const createPlacement = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof createPlacementSchema>) =>
    z.parse(createPlacementSchema, input)
  )
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    await db.insert(placement).values({
      id,
      ...data,
      location: data.location ?? null,
      durationWeeks: data.durationWeeks ?? null,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    });
    return { id };
  });

const updatePlacementSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  location: z.string().optional(),
  durationWeeks: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(["draft", "open", "filled", "closed"]).optional(),
});

export const updatePlacement = createServerFn({ method: "POST" })
  .inputValidator((input: z.input<typeof updatePlacementSchema>) =>
    z.parse(updatePlacementSchema, input)
  )
  .handler(async ({ data }) => {
    const { id, ...updates } = data;
    await db
      .update(placement)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(placement.id, id));
    return { success: true };
  });

export const applyToPlacement = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { apprenticeId: string; placementId: string; coverMessage?: string }) => input
  )
  .handler(async ({ data }) => {
    const existing = await db
      .select()
      .from(application)
      .where(
        and(
          eq(application.apprenticeId, data.apprenticeId),
          eq(application.placementId, data.placementId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("You have already applied to this placement.");
    }

    const id = crypto.randomUUID();
    await db.insert(application).values({
      id,
      apprenticeId: data.apprenticeId,
      placementId: data.placementId,
      coverMessage: data.coverMessage ?? null,
    });
    return { id };
  });
