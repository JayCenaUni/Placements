/**
 * @file Server functions for the competency system.
 *
 * @description
 * Manages competency data retrieval and the **competency gap analysis** feature.
 * Competencies are skills (behavioural or technical) that can be developed
 * through placements. The system tracks which competencies each apprentice has
 * achieved and which competencies each placement develops, enabling a gap
 * analysis that helps apprentices choose placements that fill their skill gaps.
 *
 * @feature competency-gap-analysis
 * When an apprentice views the placements list and sorts by "Competency Gaps",
 * `listPlacementsWithGaps` runs a query that:
 * 1. Computes which competency IDs the apprentice has already achieved.
 * 2. For each placement, counts how many of its linked competencies are NOT
 *    in the apprentice's achieved set (the "gap count").
 * 3. Orders placements by gap count descending, so placements that would teach
 *    the most new competencies appear first.
 *
 * This encourages apprentices to pursue placements that complement their
 * existing skills rather than duplicating them.
 *
 * @see `db/schema.ts` for the `competency`, `apprenticeCompetency`, and
 *   `placementCompetency` table definitions.
 */
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

/**
 * Lists all competencies in the system, ordered by category then name.
 */
export const listCompetencies = createServerFn({ method: "GET" })
  .handler(async () => {
    const results = await db
      .select()
      .from(competency)
      .orderBy(competency.category, competency.name);

    return results;
  });

/**
 * Fetches all competencies achieved by a specific apprentice.
 *
 * Returns competency details (name, category, description) plus the
 * `achievedAt` timestamp from the join table. Used by the profile page and
 * the placement detail page (to distinguish achieved vs gap competencies).
 */
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

/**
 * Fetches all competencies linked to a specific placement.
 *
 * Returns competency details ordered by category then name. Used to display
 * what an apprentice would learn from a particular placement.
 */
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

/**
 * Lists all placements enriched with a **competency gap count** specific to
 * the given apprentice.
 *
 * The gap count represents how many of the placement's competencies the
 * apprentice has NOT yet achieved. Placements are ordered by gap count
 * descending (most gaps first), then by creation date, so the most
 * skill-beneficial placements appear at the top.
 *
 * @query-strategy
 * Uses a correlated subquery for the apprentice's achieved competency IDs
 * and a CASE expression within COUNT(DISTINCT ...) to compute gaps in a
 * single grouped query. This avoids N+1 queries and keeps the operation
 * efficient even with many placements.
 */
export const listPlacementsWithGaps = createServerFn({ method: "GET" })
  .inputValidator((input: { apprenticeId: string }) => input)
  .handler(async ({ data }) => {
    // Subquery: competency IDs the apprentice has already achieved.
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
