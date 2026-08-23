import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { waitlistSchema } from "@foco/shared";
import { db, schema } from "../db";
import { parseBody } from "../lib/errors";

/** Rotas públicas usadas pelo site. */
export const waitlistRoutes = new Hono();

waitlistRoutes.post("/waitlist", async (c) => {
  const input = await parseBody(c, waitlistSchema);
  const exists = db.select({ id: schema.waitlist.id }).from(schema.waitlist).where(eq(schema.waitlist.email, input.email)).get();
  if (exists) return c.json({ ok: true, alreadyJoined: true });
  db.insert(schema.waitlist).values({ id: randomUUID(), email: input.email, source: input.source ?? "site" }).run();
  return c.json({ ok: true, alreadyJoined: false }, 201);
});
