import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { apprenticeRequest, placement, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

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

export const getManagerPlacements = createServerFn({ method: "GET" })
  .inputValidator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    return db
      .select({ id: placement.id, title: placement.title })
      .from(placement)
      .where(eq(placement.placementManagerId, userId));
  });

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
