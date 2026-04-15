/**
 * @file Database connection singleton.
 *
 * @description
 * Creates and exports the Drizzle ORM client that all server functions use to
 * query the SQLite database. The connection is initialised once at module load
 * and reused across requests (TanStack Start runs server functions in a
 * long-lived Node process, so this behaves as a singleton).
 *
 * Drizzle's `libsql` driver is used because it supports both local file-based
 * SQLite (for development) and Turso's hosted libSQL (for production) via the
 * same `DATABASE_URL` env var.
 *
 * Passing the full `schema` import enables Drizzle's relational query API
 * (`db.query.<table>.findFirst(...)`) in addition to the standard select/insert
 * builder API. Both styles are used throughout the server functions.
 *
 * @env DATABASE_URL — Connection string for the database. Defaults to a local
 *   SQLite file at `db/placements.db` relative to the project root. In
 *   production this could point to a Turso instance.
 *
 * @consumers All files in `src/server/*.ts` and `src/db/seed.ts`.
 */
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL || "file:./db/placements.db",
  },
  schema,
});
