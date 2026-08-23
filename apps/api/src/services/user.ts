import { eq } from "drizzle-orm";
import { DEFAULT_SETTINGS, type Settings } from "@foco/shared";
import { db, schema } from "../db";
import { notFound } from "../lib/errors";
import { toSettings } from "./mappers";

export function getSettings(userId: string): Settings {
  const row = db.select().from(schema.settings).where(eq(schema.settings.userId, userId)).get();
  if (row) return toSettings(row);
  db.insert(schema.settings).values({ userId }).onConflictDoNothing().run();
  return { ...DEFAULT_SETTINGS, restDays: [] };
}

export function getUser(userId: string) {
  const row = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!row) throw notFound("Usuário");
  return row;
}
