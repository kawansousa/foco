import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { loginSchema, registerSchema, updateMeSchema, type AuthResponse, type MeResponse } from "@foco/shared";
import { db, schema } from "../db";
import { hashPassword, requireAuth, signToken, verifyPassword, type AuthEnv } from "../lib/auth";
import { HttpError, parseBody } from "../lib/errors";
import { toUser } from "../services/mappers";
import { listEarned } from "../services/trophies";
import { getSettings, getUser } from "../services/user";

export const authRoutes = new Hono<AuthEnv>();

authRoutes.post("/auth/register", async (c) => {
  const input = await parseBody(c, registerSchema);
  const exists = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, input.email)).get();
  if (exists) throw new HttpError(409, "Já existe uma conta com esse e-mail.");

  const user = db
    .insert(schema.users)
    .values({ id: randomUUID(), name: input.name, email: input.email, passwordHash: await hashPassword(input.password) })
    .returning()
    .get();
  db.insert(schema.settings).values({ userId: user.id }).run();

  const body: AuthResponse = { token: await signToken(user.id), user: toUser(user), settings: getSettings(user.id), trophyCount: 0 };
  return c.json(body, 201);
});

authRoutes.post("/auth/login", async (c) => {
  const input = await parseBody(c, loginSchema);
  const user = db.select().from(schema.users).where(eq(schema.users.email, input.email)).get();
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, "E-mail ou senha incorretos.");
  }
  const body: AuthResponse = {
    token: await signToken(user.id),
    user: toUser(user),
    settings: getSettings(user.id),
    trophyCount: listEarned(user.id).length,
  };
  return c.json(body);
});

function meResponse(userId: string): MeResponse {
  return { user: toUser(getUser(userId)), settings: getSettings(userId), trophyCount: listEarned(userId).length };
}

authRoutes.get("/me", requireAuth, (c) => c.json(meResponse(c.get("userId"))));

authRoutes.patch("/me", requireAuth, async (c) => {
  const userId = c.get("userId");
  const input = await parseBody(c, updateMeSchema);
  const patch: Partial<typeof schema.users.$inferInsert> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.avatar !== undefined) patch.avatar = input.avatar;
  if (Object.keys(patch).length > 0) db.update(schema.users).set(patch).where(eq(schema.users.id, userId)).run();
  return c.json(meResponse(userId));
});
