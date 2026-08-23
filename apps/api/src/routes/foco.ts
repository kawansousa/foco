import { eq, and } from "drizzle-orm";
import { Hono } from "hono";
import {
  TROPHIES,
  createGoalSchema,
  isISODate,
  todayISO,
  updateGoalSchema,
  updateSettingsSchema,
  updateTrophySchema,
  upsertCheckinSchema,
  type TrophyView,
} from "@foco/shared";
import { db, schema } from "../db";
import { requireAuth, type AuthEnv } from "../lib/auth";
import { HttpError, notFound, parseBody } from "../lib/errors";
import * as svc from "../services/foco";
import { toSettings, toTrophy } from "../services/mappers";
import { listEarned } from "../services/trophies";
import { getSettings } from "../services/user";

export const focoRoutes = new Hono<AuthEnv>();
focoRoutes.use("*", requireAuth);

/** `?date=YYYY-MM-DD` (hoje no fuso do cliente); sem ele, usa a data do servidor. */
function dateParam(raw: string | undefined) {
  if (!raw) return todayISO();
  if (!isISODate(raw)) throw new HttpError(400, "Parâmetro date inválido (YYYY-MM-DD).");
  return raw;
}

/* ---------- metas ---------- */

focoRoutes.get("/goals", (c) => {
  const date = dateParam(c.req.query("date"));
  const status = c.req.query("status");
  let goals = svc.goalsWithProgress(c.get("userId"), date);
  if (status) goals = goals.filter((g) => g.status === status);
  return c.json({ goals });
});

focoRoutes.post("/goals", async (c) => {
  const input = await parseBody(c, createGoalSchema);
  return c.json(svc.createGoal(c.get("userId"), input, todayISO()), 201);
});

focoRoutes.get("/goals/:id", (c) => {
  const date = dateParam(c.req.query("date"));
  return c.json(svc.goalDetail(c.get("userId"), c.req.param("id"), date));
});

focoRoutes.patch("/goals/:id", async (c) => {
  const input = await parseBody(c, updateGoalSchema);
  return c.json(svc.updateGoal(c.get("userId"), c.req.param("id"), input, todayISO()));
});

focoRoutes.post("/goals/:id/complete", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { date?: string };
  const date = dateParam(body.date);
  return c.json(svc.completeGoal(c.get("userId"), c.req.param("id"), date));
});

focoRoutes.delete("/goals/:id", (c) => {
  svc.deleteGoal(c.get("userId"), c.req.param("id"));
  return c.body(null, 204);
});

/* ---------- hoje / check-ins ---------- */

focoRoutes.get("/today", (c) => {
  const date = dateParam(c.req.query("date"));
  return c.json(svc.todayView(c.get("userId"), date));
});

focoRoutes.put("/checkins", async (c) => {
  const input = await parseBody(c, upsertCheckinSchema);
  return c.json(svc.upsertCheckin(c.get("userId"), input));
});

focoRoutes.get("/checkins", (c) => {
  const from = c.req.query("from");
  const to = c.req.query("to");
  if (from && !isISODate(from)) throw new HttpError(400, "from inválido");
  if (to && !isISODate(to)) throw new HttpError(400, "to inválido");
  return c.json({ checkins: svc.listCheckins(c.get("userId"), { from, to, goalId: c.req.query("goalId") }) });
});

/* ---------- troféus ---------- */

focoRoutes.get("/trophies", (c) => {
  const earned = listEarned(c.get("userId"));
  const trophies: TrophyView[] = [];
  for (const def of TROPHIES) {
    const mine = earned.filter((t) => t.code === def.code);
    if (def.perGoal && mine.length > 1) {
      for (const e of mine) trophies.push({ ...def, earned: e });
    } else {
      trophies.push({ ...def, earned: mine[0] ?? null });
    }
  }
  return c.json({ trophies });
});

focoRoutes.patch("/trophies/:id", async (c) => {
  const input = await parseBody(c, updateTrophySchema);
  const row = db
    .update(schema.trophies)
    .set({ note: input.note })
    .where(and(eq(schema.trophies.id, c.req.param("id")), eq(schema.trophies.userId, c.get("userId"))))
    .returning()
    .get();
  if (!row) throw notFound("Troféu");
  return c.json(toTrophy(row));
});

/* ---------- configurações do Fô ---------- */

focoRoutes.get("/settings", (c) => c.json(getSettings(c.get("userId"))));

focoRoutes.put("/settings", async (c) => {
  const input = await parseBody(c, updateSettingsSchema);
  const userId = c.get("userId");
  getSettings(userId); // garante a linha
  const row = db
    .update(schema.settings)
    .set({
      ...(input.reminderTime !== undefined && { reminderTime: input.reminderTime }),
      ...(input.middayTime !== undefined && { middayTime: input.middayTime }),
      ...(input.streakAlertTime !== undefined && { streakAlertTime: input.streakAlertTime }),
      ...(input.tone !== undefined && { tone: input.tone }),
      ...(input.celebrateTrophies !== undefined && { celebrateTrophies: input.celebrateTrophies }),
      ...(input.quietOnRestDays !== undefined && { quietOnRestDays: input.quietOnRestDays }),
      ...(input.restDays !== undefined && { restDays: JSON.stringify([...new Set(input.restDays)].sort()) }),
    })
    .where(eq(schema.settings.userId, userId))
    .returning()
    .get()!;
  return c.json(toSettings(row));
});

/* ---------- progresso / Fô ---------- */

focoRoutes.get("/stats", (c) => c.json(svc.stats(c.get("userId"), dateParam(c.req.query("date")))));

focoRoutes.get("/fo/schedule", (c) => {
  const date = dateParam(c.req.query("date"));
  return c.json({ date, messages: svc.foSchedule(c.get("userId"), date) });
});
