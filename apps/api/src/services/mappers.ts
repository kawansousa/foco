import type { Checkin, EarnedTrophy, Goal, Settings, TrophyCode, User } from "@foco/shared";
import type { CheckinRow, GoalRow, SettingsRow, TrophyRow, UserRow } from "../db/schema";

export const toUser = (u: UserRow): User => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar ?? null, createdAt: u.createdAt });

export const toSettings = (s: SettingsRow): Settings => ({
  reminderTime: s.reminderTime,
  middayTime: s.middayTime,
  streakAlertTime: s.streakAlertTime,
  tone: s.tone,
  celebrateTrophies: s.celebrateTrophies,
  quietOnRestDays: s.quietOnRestDays,
  restDays: safeJsonArray(s.restDays),
});

export const toGoal = (g: GoalRow): Goal => ({
  id: g.id,
  title: g.title,
  stepTitle: g.stepTitle,
  description: g.description,
  startDate: g.startDate,
  dueDate: g.dueDate,
  reminderTime: g.reminderTime,
  status: g.status,
  completedAt: g.completedAt,
  createdAt: g.createdAt,
});

export const toCheckin = (c: CheckinRow): Checkin => ({
  id: c.id,
  goalId: c.goalId,
  date: c.date,
  done: c.done,
  difficulty: c.difficulty,
  note: c.note,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt,
});

export const toTrophy = (t: TrophyRow): EarnedTrophy => ({
  id: t.id,
  code: t.code as TrophyCode,
  goalId: t.goalId,
  date: t.date,
  earnedAt: t.earnedAt,
  note: t.note,
});

function safeJsonArray(s: string): number[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6) : [];
  } catch {
    return [];
  }
}
