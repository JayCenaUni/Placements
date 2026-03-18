import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { user, placement } from "@/db/schema";
import { eq, count } from "drizzle-orm";

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
