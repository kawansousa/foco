import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { loginSchema, registerSchema, type AuthResponse, type MeResponse } from "@foco/shared";
import { db, schema } from "../db";
import { hashPassword, requireAuth, signToken, verifyPassword, type AuthEnv } from "../lib/auth";
import { HttpError, parseBody } from "../lib/errors";
import { toUser } from "../services/mappers";
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

  const body: AuthResponse = { token: await signToken(user.id), user: toUser(user), settings: getSettings(user.id) };
  return c.json(body, 201);
});

authRoutes.post("/auth/login", async (c) => {
  const input = await parseBody(c, loginSchema);
  const user = db.select().from(schema.users).where(eq(schema.users.email, input.email)).get();
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    throw new HttpError(401, "E-mail ou senha incorretos.");
  }
  const body: AuthResponse = { token: await signToken(user.id), user: toUser(user), settings: getSettings(user.id) };
  return c.json(body);
});

authRoutes.get("/me", requireAuth, (c) => {
  const userId = c.get("userId");
  const body: MeResponse = { user: toUser(getUser(userId)), settings: getSettings(userId) };
  return c.json(body);
});
