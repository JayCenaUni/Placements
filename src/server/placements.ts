/**
 * @file Server functions for placement CRUD and application submission.
 *
 * @description
 * Handles all placement-related operations: listing, detail retrieval,
 * creation, status updates, and the act of an apprentice applying to a
 * placement. These server functions are called from:
 * - `routes/_authed/placements/index.tsx` (listing)
 * - `routes/_authed/placements/$placementId.tsx` (detail, apply, status update)
 * - `routes/_authed/placements/new.tsx` (creation)
 *
 * @domain
 * A "placement" is a structured role/position within an organisation's team
 * that apprentices rotate into as part of their apprenticeship programme.
 * Placements are created and owned by placement managers.
 *
 * @state-machine Placement status: draft → open → filled → closed
 *   (see `docs/uml/state-diagrams.md` §1)
 *
 * @validation
 * Write operations (`createPlacement`, `updatePlacement`) use Zod v4 schemas
 * for input validation, following the pattern documented in
 * `docs/uml/sequence-diagrams.md` §6.
 *
 * @see `docs/uml/sequence-diagrams.md` §4 for the application flow.
 * @see `docs/uml/activity-diagram.md` §1 for the full placement lifecycle.
 */
import { createServerFn } from "@tanstack/react-start";
import { db } from "@/db";
import { placement, application, user, placementCompetency, competency } from "@/db/schema";
import { eq, sql, and, count } from "drizzle-orm";
import { z } from "zod/v4";

/**
 * Lists all placements with optional status filtering.
 *
 * Joins to the user table to resolve the placement manager's name, and to the
 * application table to provide an application count per placement. Used by the
 * placements listing page (`/placements`) in "date" sort mode.
 *
 * @param data.status — Optional status filter (e.g. "open").
 * @returns Array of placements with `managerName` and `applicationCount` enrichments.
 */
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

/**
 * Fetches a single placement by ID with full detail: manager info, all
 * applications (with apprentice names), and linked competencies.
 *
 * Used by the placement detail page (`/placements/$placementId`). Competencies
 * are ordered by category (behavioural, technical) then name, enabling the
 * detail page to render them in grouped sections.
 *
 * @param id — The placement's UUID.
 * @returns The placement with enriched fields, or null if not found.
 */
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

    const competencies = await db
      .select({
        id: competency.id,
        name: competency.name,
        category: competency.category,
        description: competency.description,
      })
      .from(placementCompetency)
      .innerJoin(competency, eq(placementCompetency.competencyId, competency.id))
      .where(eq(placementCompetency.placementId, id))
      .orderBy(competency.category, competency.name);

    return {
      ...result[0].placement,
      managerName: result[0].managerName ?? "Unknown",
      managerEmail: result[0].managerEmail ?? "",
      competencies,
      applications: applications.map((a) => ({
        ...a.application,
        apprenticeName: a.apprenticeName,
      })),
    };
  });

/** Zod v4 validation schema for new placement creation. */
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

/**
 * Creates a new placement listing.
 *
 * Only placement managers should call this (enforced by the `beforeLoad` guard
 * in `routes/_authed/placements/new.tsx`). Input is validated against a Zod
 * schema. The placement is created with a generated UUID and default timestamps.
 *
 * @see `docs/uml/sequence-diagrams.md` §6 for the create placement flow.
 * @see `docs/uml/state-diagrams.md` §1 — new placements start in "draft" by default.
 */
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

/** Zod v4 validation schema for partial placement updates. */
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

/**
 * Updates an existing placement (partial update).
 *
 * Typically used to change the placement's status (e.g. draft → open) from
 * the placement detail page's "Manage" card. Also sets `updatedAt` to now.
 *
 * @see `docs/uml/state-diagrams.md` §1 for valid status transitions.
 */
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

/**
 * Submits an apprentice's application to a placement.
 *
 * Enforces a uniqueness constraint in application code: each apprentice can
 * apply to a given placement only once. If a duplicate is detected, an error
 * is thrown. New applications start in "pending" status (default from schema).
 *
 * @see `docs/uml/sequence-diagrams.md` §4 for the full application flow.
 * @see `docs/uml/state-diagrams.md` §2 — applications start as "pending".
 */
export const applyToPlacement = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { apprenticeId: string; placementId: string; coverMessage?: string }) => input
  )
  .handler(async ({ data }) => {
    // Duplicate check — each apprentice can apply to a placement only once.
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
