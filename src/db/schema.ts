import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ── Better Auth managed tables ──────────────────────────────────────────────

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

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// ── Application tables ──────────────────────────────────────────────────────

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

export const review = sqliteTable("review", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  apprenticeId: text("apprentice_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  placementId: text("placement_id")
    .notNull()
    .references(() => placement.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

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

// ── Type exports ────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type ApprenticeProfile = typeof apprenticeProfile.$inferSelect;
export type Placement = typeof placement.$inferSelect;
export type NewPlacement = typeof placement.$inferInsert;
export type Application = typeof application.$inferSelect;
export type Review = typeof review.$inferSelect;
export type ManagerAssignment = typeof managerAssignment.$inferSelect;
export type ApprenticeRequest = typeof apprenticeRequest.$inferSelect;
