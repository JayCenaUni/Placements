/**
 * @file Server functions for the placement manager directory.
 *
 * @description
 * Provides data for the `/managers` page, which is a directory of all
 * placement managers in the system. This page is only accessible to
 * apprentice_manager role users (enforced by the route's `beforeLoad` guard).
 *
 * @see `docs/uml/use-case-diagram.md` — "View Manager Assignments" is
 *   exclusively an apprentice_manager use case.
 */
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { user, placement } from "@/db/schema";
import { eq, count } from "drizzle-orm";

/**
 * Lists all users with the "placement_manager" role along with the count
 * of placements each one owns.
 *
 * Uses a left join with GROUP BY to count placements per manager (managers
 * with zero placements will show `placementCount: 0`).
 */
export const listPlacementManagers = createServerFn({ method: "GET" }).handler(
  async () => {
    const managers = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        placementCount: count(placement.id),
      })
      .from(user)
      .leftJoin(placement, eq(user.id, placement.placementManagerId))
      .where(eq(user.role, "placement_manager"))
      .groupBy(user.id);

    return managers;
  }
);
