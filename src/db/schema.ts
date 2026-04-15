/**
 * @file Database schema — single source of truth for all table definitions.
 *
 * @description
 * This file uses Drizzle ORM's SQLite column helpers to declare every table in
 * the system. It is the canonical reference for column names, types, defaults,
 * and foreign-key relationships. Drizzle Kit reads this file to generate SQL
 * migrations (`pnpm db:generate`) and push schema changes (`pnpm db:push`).
 *
 * @architecture
 * The schema is split into two groups:
 *
 * 1. **Better Auth tables** — `user`, `session`, `account`, `verification`.
 *    These conform to the table structure expected by the Better Auth library
 *    and its Drizzle adapter. Better Auth reads/writes these tables directly
 *    for signup, login, session management, and password hashing. The `user`
 *    table is extended with a custom `role` column (see below).
 *
 * 2. **Application domain tables** — `apprenticeProfile`, `placement`,
 *    `application`, `review`, `managerAssignment`, `apprenticeRequest`,
 *    `competency`, `apprenticeCompetency`, `placementCompetency`.
 *    These model the core business domain: apprenticeship placement management
 *    within a large organisation. See the class diagram in
 *    `docs/uml/class-diagram.md` for a visual entity-relationship overview.
 *
 * @domain-roles
 * Three roles govern access across the entire application:
 * - **apprentice** — Browses placements, applies, tracks applications, writes reviews.
 * - **apprentice_manager** — Oversees a group of apprentices, reviews applications,
 *   views the "apprentice locations" dashboard.
 * - **placement_manager** — Creates/manages placement listings, requests apprentices,
 *   views applications and reviews on their placements.
 *
 * @state-machines
 * Several entities have status enums that model finite state machines:
 * - `Placement.status`: draft → open → filled → closed
 *   (see `docs/uml/state-diagrams.md` §1)
 * - `Application.status`: pending → approved | denied | withdrawn
 *   (see `docs/uml/state-diagrams.md` §2)
 * - `ApprenticeRequest.status`: open → accepted | declined
 *   (see `docs/uml/state-diagrams.md` §3)
 *
 * @side-effects
 * When an application is approved (`reviewApplication` in `server/applications.ts`),
 * the apprentice's `apprenticeProfile.currentPlacementId` is automatically updated
 * to point to the approved placement.
 */
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ── Better Auth managed tables ──────────────────────────────────────────────
// These four tables (user, session, account, verification) are required by
// Better Auth and managed by its Drizzle adapter. The column names and types
// follow Better Auth's conventions. Only the `role` column on `user` is a
// custom addition — it drives role-based access control throughout the app.

/**
 * Central identity table for every person in the system.
 *
 * Better Auth owns the core columns (id, name, email, emailVerified, image,
 * createdAt, updatedAt). The custom `role` column is passed via
 * `user.additionalFields` in the Better Auth config (`lib/auth.ts`) and is
 * included in the session payload so route guards and components can branch
 * on it without an extra DB lookup.
 *
 * @relationship 1:0..1 → apprenticeProfile (extended info for apprentices)
 * @relationship 1:N → placement (placement managers own placements)
 * @relationship 1:N → application (apprentices submit applications)
 * @relationship 1:N → review (apprentices write reviews)
 * @relationship 1:N → managerAssignment (apprentice managers oversee apprentices)
 * @relationship 1:N → apprenticeRequest (placement managers request apprentices)
 * @relationship 1:N → session (Better Auth sessions, cascade delete)
 * @relationship 1:N → account (Better Auth credential accounts, cascade delete)
 */
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  role: text("role", { enum: ["apprentice", "apprentice_manager", "placement_manager"] })
    .notNull()
    .default("apprentice"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Active login sessions managed by Better Auth.
 *
 * Each row represents one browser/device session. The session `token` is stored
 * in an HTTP-only cookie and validated on every authenticated request via
 * `getSession()` in `lib/auth-server.ts`. Sessions are configured with a 7-day
 * expiry and 1-day refresh window (see `lib/auth.ts`).
 *
 * @cascade Deleting a user cascades to all their sessions.
 */
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

/**
 * Better Auth credential/provider accounts.
 *
 * For email/password auth (the only provider enabled in this app), the `password`
 * column stores the bcrypt hash. The `providerId` is "credential" and `accountId`
 * matches the user's ID. OAuth fields (accessToken, refreshToken, etc.) exist
 * for future provider expansion but are unused.
 *
 * @cascade Deleting a user cascades to all their accounts.
 */
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Better Auth verification tokens (e.g. email verification, password reset).
 *
 * Currently unused because email verification is not enforced, but the table
 * is required by Better Auth's adapter contract.
 */
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ── Application domain tables ───────────────────────────────────────────────
// These tables model the core business domain: apprenticeship placement
// management. See `docs/uml/class-diagram.md` §2 for the entity-relationship
// diagram and `docs/uml/state-diagrams.md` for status lifecycle definitions.

/**
 * Extended profile for users with the "apprentice" role.
 *
 * One-to-one with `user` (enforced by the unique constraint on `userId`).
 * Contains apprentice-specific metadata that doesn't belong on the shared
 * user table: department, intake cohort, bio, comma-separated skills, phone.
 *
 * The `currentPlacementId` FK is the critical field that tracks which placement
 * an apprentice is currently assigned to. It is automatically updated when an
 * application is approved (see `reviewApplication` in `server/applications.ts`
 * and the "Approval Side Effect" in `docs/uml/state-diagrams.md` §2).
 *
 * @relationship N:1 → user (cascade delete)
 * @relationship N:0..1 → placement via currentPlacementId (set null on delete)
 */
export const apprenticeProfile = sqliteTable("apprentice_profile", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  department: text("department"),
  cohort: text("cohort"),
  bio: text("bio"),
  skills: text("skills"),
  phone: text("phone"),
  currentPlacementId: text("current_placement_id").references(() => placement.id, {
    onDelete: "set null",
  }),
});

/**
 * A placement listing created and owned by a placement manager.
 *
 * Represents a role/position within a team that an apprentice can rotate into
 * as part of their structured apprenticeship programme. Placement managers
 * create listings (initially as "draft"), publish them ("open"), and manage
 * their lifecycle through to "filled" or "closed".
 *
 * @state-machine draft → open → filled → closed (see `docs/uml/state-diagrams.md` §1)
 * - draft: Only visible to the owning placement manager for editing.
 * - open: Visible to all users; apprentices can browse and apply.
 * - filled: All capacity has been filled by approved applications.
 * - closed: Completed or cancelled; no further applications accepted.
 *
 * @relationship N:1 → user via placementManagerId (the placement manager who owns this listing)
 * @relationship 1:N → application (apprentice applications to this placement)
 * @relationship 1:N → review (apprentice reviews of this placement)
 * @relationship 1:N → apprenticeRequest (placement manager requests for apprentices)
 * @relationship 1:N → apprenticeProfile via currentPlacementId (apprentices currently placed here)
 * @relationship 1:N → placementCompetency (competencies developed during this placement)
 */
export const placement = sqliteTable("placement", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description").notNull(),
  department: text("department").notNull(),
  location: text("location"),
  durationWeeks: integer("duration_weeks"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  capacity: integer("capacity").notNull().default(1),
  placementManagerId: text("placement_manager_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["draft", "open", "filled", "closed"] })
    .notNull()
    .default("draft"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * An apprentice's application to a specific placement.
 *
 * Created when an apprentice submits an application from the placement detail
 * page. Each apprentice can apply to a given placement only once (enforced in
 * `applyToPlacement` server function via a duplicate check, not a DB constraint).
 *
 * @state-machine pending → approved | denied | withdrawn (see `docs/uml/state-diagrams.md` §2)
 * - pending: Awaiting review by an apprentice manager.
 * - approved: Accepted — triggers a side effect that sets the apprentice's
 *   `currentPlacementId` on their profile.
 * - denied: Rejected by the reviewing manager.
 * - withdrawn: The apprentice withdrew their own application.
 *
 * @field reviewedBy — The user (typically an apprentice_manager) who approved/denied.
 *   Set to null on user deletion (set null) to preserve audit trail.
 *
 * @relationship N:1 → user via apprenticeId (the apprentice who applied)
 * @relationship N:1 → placement via placementId (the target placement)
 * @relationship N:0..1 → user via reviewedBy (the manager who reviewed)
 */
export const application = sqliteTable("application", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  apprenticeId: text("apprentice_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  placementId: text("placement_id")
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  coverMessage: text("cover_message"),
  status: text("status", { enum: ["pending", "approved", "denied", "withdrawn"] })
    .notNull()
    .default("pending"),
  reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
  appliedAt: integer("applied_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * An apprentice's feedback review of a completed placement.
 *
 * Apprentices can only review placements where they have an approved application
 * and haven't already submitted a review (enforced in `createReview` server
 * function). The `getReviewablePlacements` server function computes the eligible
 * set: approved placements minus already-reviewed placements.
 *
 * @field rating — Integer 1–5 star rating.
 *
 * @relationship N:1 → user via apprenticeId (the apprentice who wrote the review)
 * @relationship N:1 → placement via placementId (the reviewed placement)
 */
export const review = sqliteTable("review", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  apprenticeId: text("apprentice_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  placementId: text("placement_id")
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Competency-level achievement recorded as part of a review.
 *
 * For each competency offered by the reviewed placement, the apprentice records
 * one of three outcomes:
 * - `not_achieved` (red)
 * - `partially_achieved` (orange)
 * - `fully_achieved` (green)
 *
 * @relationship N:1 → review via reviewId
 * @relationship N:1 → competency via competencyId
 */
export const reviewCompetency = sqliteTable("review_competency", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  reviewId: text("review_id")
    .notNull()
    .references(() => review.id, { onDelete: "cascade" }),
  competencyId: text("competency_id")
    .notNull()
    .references(() => competency.id, { onDelete: "cascade" }),
  achievement: text("achievement", {
    enum: ["not_achieved", "partially_achieved", "fully_achieved"],
  }).notNull(),
});

/**
 * Links an apprentice manager to the apprentices they oversee.
 *
 * Each apprentice has at most one manager (enforced by the unique constraint on
 * `apprenticeId`). An apprentice manager can oversee many apprentices. This
 * relationship determines which apprentices appear on the apprentice manager's
 * dashboard and which applications they can see.
 *
 * @relationship N:1 → user via managerId (the apprentice_manager)
 * @relationship N:1 → user via apprenticeId (the apprentice being managed)
 * @constraint apprenticeId is unique — each apprentice has exactly one manager.
 */
export const managerAssignment = sqliteTable("manager_assignment", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  managerId: text("manager_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  apprenticeId: text("apprentice_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  assignedAt: integer("assigned_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * A placement manager's request for an apprentice to fill one of their placements.
 *
 * This is an outbound request from a placement manager, as opposed to an
 * application which is inbound from an apprentice. Requests are visible on the
 * placement manager's requests page and can be accepted or declined.
 *
 * @state-machine open → accepted | declined (see `docs/uml/state-diagrams.md` §3)
 *
 * @relationship N:1 → user via placementManagerId (the requesting placement manager)
 * @relationship N:1 → placement via placementId (the target placement)
 */
export const apprenticeRequest = sqliteTable("apprentice_request", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  placementManagerId: text("placement_manager_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  placementId: text("placement_id")
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  message: text("message"),
  status: text("status", { enum: ["open", "accepted", "declined"] })
    .notNull()
    .default("open"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * A skill or behaviour that can be developed through placements.
 *
 * Competencies are categorised as either "behavioural" (soft skills like
 * communication, teamwork) or "technical" (hard skills like software
 * development, cloud infrastructure). They are linked to both placements
 * (what a placement develops) and apprentices (what they have achieved).
 *
 * This enables the "competency gap" feature: when an apprentice browses
 * placements sorted by gaps, the system compares their achieved competencies
 * against each placement's competency list to surface the most beneficial
 * placements (see `listPlacementsWithGaps` in `server/competencies.ts`).
 */
export const competency = sqliteTable("competency", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  category: text("category", { enum: ["behavioural", "technical"] }).notNull(),
  description: text("description"),
});

/**
 * Join table: competencies an apprentice has achieved.
 *
 * Populated as apprentices progress through placements. Displayed on the
 * apprentice's profile page and the apprentice detail page (for managers).
 * Used in competency gap analysis to determine which competencies an
 * apprentice still needs.
 *
 * @relationship N:1 → user via apprenticeId (the apprentice)
 * @relationship N:1 → competency via competencyId (the achieved competency)
 */
export const apprenticeCompetency = sqliteTable("apprentice_competency", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  apprenticeId: text("apprentice_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  competencyId: text("competency_id")
    .notNull()
    .references(() => competency.id, { onDelete: "cascade" }),
  achievedAt: integer("achieved_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Join table: competencies that a placement develops.
 *
 * Shown on the placement detail page. For apprentices, achieved vs unachieved
 * competencies are visually distinguished (green = achieved, yellow = gap).
 * The gap count is used by `listPlacementsWithGaps` to rank placements by
 * how many new competencies they would provide to a specific apprentice.
 *
 * @relationship N:1 → placement via placementId
 * @relationship N:1 → competency via competencyId
 */
export const placementCompetency = sqliteTable("placement_competency", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  placementId: text("placement_id")
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  competencyId: text("competency_id")
    .notNull()
    .references(() => competency.id, { onDelete: "cascade" }),
});

// ── Type exports ────────────────────────────────────────────────────────────
// Drizzle's $inferSelect and $inferInsert generate TypeScript types from the
// table definitions above. Select types represent rows read from the DB;
// Insert types represent the shape needed to create new rows (with defaults
// omitted). These types are used throughout server functions and components.

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type ApprenticeProfile = typeof apprenticeProfile.$inferSelect;
export type Placement = typeof placement.$inferSelect;
export type NewPlacement = typeof placement.$inferInsert;
export type Application = typeof application.$inferSelect;
export type Review = typeof review.$inferSelect;
export type ReviewCompetency = typeof reviewCompetency.$inferSelect;
export type ManagerAssignment = typeof managerAssignment.$inferSelect;
export type ApprenticeRequest = typeof apprenticeRequest.$inferSelect;
export type Competency = typeof competency.$inferSelect;
export type ApprenticeCompetency = typeof apprenticeCompetency.$inferSelect;
export type PlacementCompetency = typeof placementCompetency.$inferSelect;
