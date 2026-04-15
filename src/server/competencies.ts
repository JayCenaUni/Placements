import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import {
  competency,
  apprenticeCompetency,
  placementCompetency,
  placement,
  application,
  user,
} from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";

export const listCompetencies = createServerFn({ method: "GET" })
  .handler(async () => {
    const results = await db
      .select()
      .from(competency)
      .orderBy(competency.category, competency.name);

    return results;
  });

export const getApprenticeCompetencies = createServerFn({ method: "GET" })
  .inputValidator((apprenticeId: string) => apprenticeId)
  .handler(async ({ data: apprenticeId }) => {
    const results = await db
      .select({
        id: competency.id,
        name: competency.name,
        category: competency.category,
        description: competency.description,
        achievedAt: apprenticeCompetency.achievedAt,
      })
      .from(apprenticeCompetency)
      .innerJoin(competency, eq(apprenticeCompetency.competencyId, competency.id))
      .where(eq(apprenticeCompetency.apprenticeId, apprenticeId))
      .orderBy(competency.category, competency.name);

    return results;
  });

export const getPlacementCompetencies = createServerFn({ method: "GET" })
  .inputValidator((placementId: string) => placementId)
  .handler(async ({ data: placementId }) => {
    const results = await db
      .select({
        id: competency.id,
        name: competency.name,
        category: competency.category,
        description: competency.description,
      })
      .from(placementCompetency)
      .innerJoin(competency, eq(placementCompetency.competencyId, competency.id))
      .where(eq(placementCompetency.placementId, placementId))
      .orderBy(competency.category, competency.name);

    return results;
  });

export const listPlacementsWithGaps = createServerFn({ method: "GET" })
  .inputValidator((input: { apprenticeId: string }) => input)
  .handler(async ({ data }) => {
    const achievedIds = db
      .select({ id: apprenticeCompetency.competencyId })
      .from(apprenticeCompetency)
      .where(eq(apprenticeCompetency.apprenticeId, data.apprenticeId));

    const results = await db
      .select({
        placement: placement,
        managerName: user.name,
        applicationCount: count(application.id),
        gapCount: sql<number>`count(distinct case when ${placementCompetency.competencyId} not in (${achievedIds}) then ${placementCompetency.competencyId} end)`.as("gap_count"),
      })
      .from(placement)
      .leftJoin(user, eq(placement.placementManagerId, user.id))
      .leftJoin(application, eq(placement.id, application.placementId))
      .leftJoin(placementCompetency, eq(placement.id, placementCompetency.placementId))
      .groupBy(placement.id)
      .orderBy(sql`gap_count DESC`, sql`${placement.createdAt} DESC`);

    return results.map((r) => ({
      ...r.placement,
      managerName: r.managerName ?? "Unknown",
      applicationCount: r.applicationCount,
      gapCount: r.gapCount,
    }));
  });
