/**
 * @file Drizzle Kit configuration — used by migration and studio commands.
 *
 * @description
 * Configures Drizzle Kit (the CLI tool) for schema migration generation,
 * schema push, and Drizzle Studio. Key settings:
 *
 * - `schema`: Points to `src/db/schema.ts` — the single source of truth for
 *   all table definitions. Drizzle Kit reads this to generate SQL migrations.
 * - `out`: Output directory for generated migration SQL files and snapshots.
 *   The `drizzle/` folder contains numbered `.sql` migration files and a
 *   `meta/` subfolder with JSON schema snapshots and a migration journal.
 * - `dialect`: SQLite — matches the database engine used at runtime.
 * - `dbCredentials.url`: The SQLite file path, defaulting to `db/placements.db`.
 *
 * @commands
 * - `pnpm db:generate` — Reads the schema, diffs against the latest snapshot,
 *   and generates a new numbered SQL migration in `drizzle/`.
 * - `pnpm db:push` — Applies the schema directly to the database without
 *   creating a migration file (useful during development).
 * - `pnpm db:studio` — Opens Drizzle Studio, a visual database browser.
 */
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "file:./db/placements.db",
  },
});
