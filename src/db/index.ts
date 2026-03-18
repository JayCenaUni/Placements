import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

export const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL || "file:./db/placements.db",
  },
  schema,
});
