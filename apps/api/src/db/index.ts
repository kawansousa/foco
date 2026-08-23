import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { env } from "../env";
import * as schema from "./schema";

const here = dirname(fileURLToPath(import.meta.url));

export function openDatabase(url: string = env.databaseUrl) {
  if (url !== ":memory:") mkdirSync(dirname(resolve(url)), { recursive: true });
  const sqlite = new Database(url);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: resolve(here, "../../drizzle") });
  return { db, sqlite };
}

export const { db, sqlite } = openDatabase();
export type Db = typeof db;
export { schema };
