import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import {
  computeStats,
  currentStreak,
  foCheckinReply,
  foMessage,
  goalActiveOn,
  goalProgress,
  isRestDay,
  todayISO,
  type CheckinResponse,
  type CreateGoalInput,
  type FoMessage,
  type Goal,
  type GoalDetail,
  type GoalWithProgress,
  type ISODate,
  type Settings,
  type StatsResponse,
  type TodayResponse,
  type UpdateGoalInput,
  type UpsertCheckinInput,
} from "@foco/shared";
import { db, schema } from "../db";
import { HttpError, notFound } from "../lib/errors";
import { toCheckin, toGoal } from "./mappers";
import { awardTrophies, listEarned } from "./trophies";
import { getSettings, getUser } from "./user";

/* ---------- leitura ---------- */

export function listGoals(userId: string): Goal[] {
  return db
    .select()
    .from(schema.goals)
    .where(eq(schema.goals.userId, userId))
    .orderBy(desc(schema.goals.createdAt))
    .all()
    .map(toGoal);
}

function getGoalRow(userId: string, goalId: string) {
  const row = db
    .select()
    .from(schema.goals)
    .where(and(eq(schema.goals.id, goalId), eq(schema.goals.userId, userId)))
    .get();
  if (!row) throw notFound("Meta");
  return row;
}

export function listCheckins(userId: string, f: { from?: ISODate; to?: ISODate; goalId?: string } = {}) {
  const conds = [eq(schema.checkins.userId, userId)];
  if (f.from) conds.push(gte(schema.checkins.date, f.from));
  if (f.to) conds.push(lte(schema.checkins.date, f.to));
  if (f.goalId) conds.push(eq(schema.checkins.goalId, f.goalId));
  return db
    .select()
    .from(schema.checkins)
    .where(and(...conds))
    .orderBy(desc(schema.checkins.date))
    .all()
    .map(toCheckin);
}

export function goalsWithProgress(userId: string, today: ISODate, settings = getSettings(userId)): GoalWithProgress[] {
  const all = listCheckins(userId);
  return listGoals(userId).map((g) => ({ ...g, progress: goalProgress(g, all, today, settings.restDays) }));
}

export function goalDetail(userId: string, goalId: string, today: ISODate): GoalDetail {
  const settings = getSettings(userId);
  const goal = toGoal(getGoalRow(userId, goalId));
  const checkins = listCheckins(userId, { goalId });
  const withDiff = checkins.filter((c) => c.done && c.difficulty != null);
  const avgDifficulty = withDiff.length
    ? Math.round((withDiff.reduce((s, c) => s + (c.difficulty ?? 0), 0) / withDiff.length) * 10) / 10
    : null;
  return {
    ...goal,
    progress: goalProgress(goal, checkins, today, settings.restDays),
    checkins,
    avgDifficulty,
    trophies: listEarned(userId).filter((t) => t.goalId === goalId),
  };
}

/* ---------- escrita de metas ---------- */

export function createGoal(userId: string, input: CreateGoalInput, today: ISODate): GoalWithProgress {
  const row = db
    .insert(schema.goals)
    .values({
      id: randomUUID(),
      userId,
      title: input.title,
      stepTitle: input.stepTitle,
      description: input.description ?? null,
      startDate: input.startDate,
      dueDate: input.dueDate,
      reminderTime: input.reminderTime ?? null,
    })
    .returning()
    .get();
  const goal = toGoal(row);
  return { ...goal, progress: goalProgress(goal, [], today, getSettings(userId).restDays) };
}

export function updateGoal(userId: string, goalId: string, input: UpdateGoalInput, today: ISODate): GoalWithProgress {
  const existing = getGoalRow(userId, goalId);
  if (input.dueDate && input.dueDate < existing.startDate) {
    throw new HttpError(400, "O prazo precisa ser depois do início.");
  }
  const row = db
    .update(schema.goals)
    .set({
      ...(input.title !== undefined && { title: input.title }),
      ...(input.stepTitle !== undefined && { stepTitle: input.stepTitle }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...(input.reminderTime !== undefined && { reminderTime: input.reminderTime }),
      ...(input.status !== undefined && {
        status: input.status,
        completedAt: input.status === "done" ? (existing.completedAt ?? new Date().toISOString()) : null,
      }),
    })
    .where(eq(schema.goals.id, goalId))
    .returning()
    .get()!;
  const goal = toGoal(row);
  const checkins = listCheckins(userId, { goalId });
  return { ...goal, progress: goalProgress(goal, checkins, today, getSettings(userId).restDays) };
}

export function completeGoal(userId: string, goalId: string, date: ISODate) {
  const existing = getGoalRow(userId, goalId);
  if (existing.status === "done") {
    return { goal: updateGoal(userId, goalId, {}, date), newTrophies: [] };
  }
  const goal = updateGoal(userId, goalId, { status: "done" }, date);
  const onTime = !existing.dueDate || date <= existing.dueDate;
  const newTrophies = awardTrophies(userId, { kind: "goal_done", date, goalId, onTime });
  return { goal, newTrophies };
}

export function deleteGoal(userId: string, goalId: string) {
  getGoalRow(userId, goalId);
  db.delete(schema.goals).where(eq(schema.goals.id, goalId)).run();
}

/* ---------- hoje ---------- */

function foContextFor(userId: string, date: ISODate, settings: Settings) {
  const goals = listGoals(userId).filter((g) => goalActiveOn(g, date) && g.status === "active");
  const todays = listCheckins(userId, { from: date, to: date });
  const byGoal = new Map(todays.map((c) => [c.goalId, c]));
  const steps = goals.map((goal) => {
    const checkin = byGoal.get(goal.id) ?? null;
    return { goal, checkin, done: checkin?.done ?? false };
  });
  const done = steps.filter((s) => s.done).length;
  const pendingStep = steps.find((s) => !s.done)?.goal.stepTitle ?? steps[0]?.goal.stepTitle ?? null;
  const streak = currentStreak(listCheckins(userId), date, settings.restDays);
  const user = getUser(userId);
  return {
    steps,
    done,
    streak,
    ctx: { name: user.name, tone: settings.tone, total: steps.length, done, streak, nextStep: pendingStep },
  };
}

export function todayView(userId: string, date: ISODate): TodayResponse {
  const settings = getSettings(userId);
  const { steps, done, streak, ctx } = foContextFor(userId, date, settings);
  const rest = isRestDay(date, settings.restDays);

  let fo: FoMessage;
  if (rest && settings.quietOnRestDays) fo = foMessage("rest_day", ctx);
  else if (steps.length > 0 && done === steps.length) fo = foMessage("day_complete", ctx);
  else if (done > 0) fo = foMessage("midday", ctx);
  else fo = foMessage("morning", ctx);

  return { date, isRestDay: rest, steps, doneCount: done, total: steps.length, streak, fo };
}

/** Agenda de mensagens do Fô para o dia — o app usa para agendar notificações locais. */
export function foSchedule(userId: string, date: ISODate): FoMessage[] {
  const settings = getSettings(userId);
  const { ctx } = foContextFor(userId, date, settings);
  if (isRestDay(date, settings.restDays) && settings.quietOnRestDays) {
    return [foMessage("rest_day", { ...ctx, time: settings.reminderTime })];
  }
  const msgs: FoMessage[] = [
    foMessage("morning", { ...ctx, time: settings.reminderTime }),
    foMessage("midday", { ...ctx, time: settings.middayTime }),
  ];
  if (ctx.total > 0) msgs.push(foMessage("streak_risk", { ...ctx, time: settings.streakAlertTime }));
  return msgs;
}

/* ---------- check-in ---------- */

export function upsertCheckin(userId: string, input: UpsertCheckinInput): CheckinResponse {
  const goal = getGoalRow(userId, input.goalId);
  if (input.date < goal.startDate) throw new HttpError(400, "Não dá pra registrar antes do início da meta.");
  if (input.date > todayISO()) {
    // tolerância de 1 dia para fusos à frente do servidor
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (input.date > todayISO(tomorrow)) throw new HttpError(400, "Não dá pra registrar no futuro.");
  }

  const now = new Date().toISOString();
  const existing = db
    .select()
    .from(schema.checkins)
    .where(and(eq(schema.checkins.goalId, input.goalId), eq(schema.checkins.date, input.date)))
    .get();

  const values = {
    done: input.done,
    difficulty: input.done ? (input.difficulty ?? existing?.difficulty ?? null) : null,
    note: input.note !== undefined ? input.note : (existing?.note ?? null),
    updatedAt: now,
  };

  const row = existing
    ? db.update(schema.checkins).set(values).where(eq(schema.checkins.id, existing.id)).returning().get()!
    : db
        .insert(schema.checkins)
        .values({ id: randomUUID(), userId, goalId: input.goalId, date: input.date, ...values })
        .returning()
        .get();

  const settings = getSettings(userId);
  const { steps, done, streak } = foContextFor(userId, input.date, settings);
  const dayComplete = steps.length > 0 && done === steps.length;

  const newTrophies = input.done
    ? awardTrophies(userId, {
        kind: "checkin",
        date: input.date,
        goalId: input.goalId,
        difficulty: values.difficulty,
        localTime: input.localTime,
        streak,
        dayComplete,
      })
    : [];

  return {
    checkin: toCheckin(row),
    newTrophies,
    streak,
    dayComplete,
    fo: foCheckinReply(values.difficulty, settings.tone, input.done),
  };
}

/* ---------- estatísticas ---------- */

export function stats(userId: string, today: ISODate): StatsResponse {
  const settings = getSettings(userId);
  return computeStats(listGoals(userId), listCheckins(userId), today, settings.restDays, {
    trophiesEarned: listEarned(userId).length,
  });
}
