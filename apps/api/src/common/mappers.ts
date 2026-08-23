import type { Checkin, EarnedTrophy, Goal, GoalStatus, Settings, Tone, TrophyCode, User } from "@foco/shared";
import type {
  Checkin as CheckinRow,
  Goal as GoalRow,
  Settings as SettingsRow,
  Trophy as TrophyRow,
  User as UserRow,
} from "../generated/prisma/client";

/**
 * Conversão das linhas do banco (Prisma) para os tipos públicos da API
 * (`@foco/shared`). Única fronteira onde Date vira string ISO e JSON vira array.
 */

export const toUser = (u: UserRow): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatar: u.avatar ?? null,
  createdAt: u.createdAt.toISOString(),
});

export const toSettings = (s: SettingsRow): Settings => ({
  reminderTime: s.reminderTime,
  middayTime: s.middayTime,
  streakAlertTime: s.streakAlertTime,
  tone: s.tone as Tone,
  celebrateTrophies: s.celebrateTrophies,
  quietOnRestDays: s.quietOnRestDays,
  restDays: parseRestDays(s.restDays),
});

export const toGoal = (g: GoalRow): Goal => ({
  id: g.id,
  title: g.title,
  stepTitle: g.stepTitle,
  description: g.description,
  startDate: g.startDate,
  dueDate: g.dueDate,
  reminderTime: g.reminderTime,
  status: g.status as GoalStatus,
  completedAt: g.completedAt?.toISOString() ?? null,
  createdAt: g.createdAt.toISOString(),
});

export const toCheckin = (c: CheckinRow): Checkin => ({
  id: c.id,
  goalId: c.goalId,
  date: c.date,
  done: c.done,
  difficulty: c.difficulty,
  note: c.note,
  createdAt: c.createdAt.toISOString(),
  updatedAt: c.updatedAt.toISOString(),
});

export const toTrophy = (t: TrophyRow): EarnedTrophy => ({
  id: t.id,
  code: t.code as TrophyCode,
  goalId: t.goalId,
  date: t.date,
  earnedAt: t.earnedAt.toISOString(),
  note: t.note,
});

/** `restDays` é guardado como JSON (`"[0,6]"`); valores fora de 0–6 ou JSON quebrado são descartados. */
export function parseRestDays(raw: string): number[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((n): n is number => Number.isInteger(n) && n >= 0 && n <= 6) : [];
  } catch {
    return [];
  }
}

/** Normaliza para gravar: sem repetidos, em ordem. */
export function serializeRestDays(days: number[]): string {
  return JSON.stringify([...new Set(days)].sort((a, b) => a - b));
}
