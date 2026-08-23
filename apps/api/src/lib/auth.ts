import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import type { Context, Next } from "hono";
import { env } from "../env";
import { HttpError } from "./errors";

const scrypt = promisify(_scrypt) as (pw: string, salt: string, keylen: number) => Promise<Buffer>;
const secret = new TextEncoder().encode(env.jwtSecret);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const key = await scrypt(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export async function signToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export type AuthEnv = { Variables: { userId: string } };

/** Middleware: exige `Authorization: Bearer <token>` e injeta `userId`. */
export async function requireAuth(c: Context<AuthEnv>, next: Next) {
  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const userId = token ? await verifyToken(token) : null;
  if (!userId) throw new HttpError(401, "Faça login para continuar.");
  c.set("userId", userId);
  await next();
}
