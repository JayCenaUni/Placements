/**
 * @file Server functions for apprentice requests.
 *
 * @description
 * Apprentice requests are the inverse of applications: instead of an apprentice
 * applying to a placement, a **placement manager** posts a request asking for
 * apprentices to fill a specific placement. Requests are visible on the
 * placement manager's "Requests" page.
 *
 * @state-machine Request status: open → accepted | declined
 *   (see `docs/uml/state-diagrams.md` §3)
 *
 * @access-control Only placement_manager role can create/view/manage requests
 *   (enforced by `beforeLoad` guards in the request routes).
 *
 * @see `docs/uml/activity-diagram.md` §3 for the request workflow.
 */
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { apprenticeRequest, placement, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Lists all apprentice requests created by the given placement manager.
 *
 * Joins to the placement table to include the placement title and department.
 * Ordered by creation date descending (newest first).
 */
export const listRequests = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const results = await db
      .select({
        request: apprenticeRequest,
        placementTitle: placement.title,
        placementDepartment: placement.department,
      })
      .from(apprenticeRequest)
      .innerJoin(placement, eq(apprenticeRequest.placementId, placement.id))
      .where(eq(apprenticeRequest.placementManagerId, userId))
      .orderBy(sql`${apprenticeRequest.createdAt} DESC`);

    return results.map((r) => ({
      ...r.request,
      placementTitle: r.placementTitle,
      placementDepartment: r.placementDepartment,
    }));
  });

/**
 * Returns a simplified list of placements owned by the given placement manager.
 *
 * Used to populate the placement dropdown in the "New Request" form. Only
 * returns id and title for each placement.
 */
export const getManagerPlacements = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    return db
      .select({ id: placement.id, title: placement.title })
      .from(placement)
      .where(eq(placement.placementManagerId, userId));
  });

/**
 * Creates a new apprentice request for a placement.
 *
 * New requests start in "open" status (default from schema). The optional
 * message lets the placement manager describe what kind of apprentice they
 * are looking for.
 */
export const createRequest = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      placementManagerId: string;
      placementId: string;
      message?: string;
    }) => input
  )
  .handler(async ({ data }) => {
    const id = crypto.randomUUID();
    await db.insert(apprenticeRequest).values({
      id,
      placementManagerId: data.placementManagerId,
      placementId: data.placementId,
      message: data.message ?? null,
    });
    return { id };
  });

/**
 * Updates the status of an apprentice request (open → accepted | declined).
 *
 * @see `docs/uml/state-diagrams.md` §3 for valid transitions.
 */
export const updateRequestStatus = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { requestId: string; status: "open" | "accepted" | "declined" }) =>
      input
  )
  .handler(async ({ data }) => {
    await db
      .update(apprenticeRequest)
      .set({ status: data.status })
      .where(eq(apprenticeRequest.id, data.requestId));
    return { success: true };
  });
