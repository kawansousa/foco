import type { ISODate } from "./dates";
import type { GoalStatus, Tone } from "./schemas";
import type { TrophyCode, TrophyDef } from "./trophies";
import type { FoMood } from "./fo";

/* ---------- entidades ---------- */

export type User = {
  id: string;
  name: string;
  email: string;
  /** data URL (image/jpeg;base64) ou null */
  avatar: string | null;
  createdAt: string;
};

export type Settings = {
  reminderTime: string;
  middayTime: string;
  streakAlertTime: string;
  tone: Tone;
  celebrateTrophies: boolean;
  quietOnRestDays: boolean;
  restDays: number[];
};

export type Goal = {
  id: string;
  title: string;
  stepTitle: string;
  description: string | null;
  startDate: ISODate;
  dueDate: ISODate | null;
  reminderTime: string | null;
  status: GoalStatus;
  completedAt: string | null;
  createdAt: string;
};

export type GoalProgress = {
  /** 0–100 */
  percent: number;
  doneDays: number;
  plannedDays: number;
  daysLeft: number | null;
  /** texto pronto: "42 dias", "contínua", "atrasada 2 dias" */
  dueLabel: string;
  lastDoneDate: ISODate | null;
};

export type GoalWithProgress = Goal & { progress: GoalProgress };

export type Checkin = {
  id: string;
  goalId: string;
  date: ISODate;
  done: boolean;
  difficulty: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EarnedTrophy = {
  id: string;
  code: TrophyCode;
  goalId: string | null;
  date: ISODate;
  earnedAt: string;
  note: string | null;
};

export type TrophyView = TrophyDef & {
  earned: EarnedTrophy | null;
};

/* ---------- respostas compostas ---------- */

export type TodayStep = {
  goal: Goal;
  checkin: Checkin | null;
  done: boolean;
};

export type FoMessage = {
  kind: "morning" | "midday" | "streak_risk" | "day_complete" | "night" | "rest_day" | "checkin";
  mood: FoMood;
  time: string | null;
  title: string;
  text: string;
};

export type TodayResponse = {
  date: ISODate;
  isRestDay: boolean;
  steps: TodayStep[];
  doneCount: number;
  total: number;
  streak: number;
  fo: FoMessage;
};

export type CheckinResponse = {
  checkin: Checkin;
  newTrophies: EarnedTrophy[];
  streak: number;
  dayComplete: boolean;
  fo: FoMessage;
};

export type DayStat = { date: ISODate; done: number; total: number; rest: boolean };

export type StatsResponse = {
  streak: number;
  bestStreak: number;
  totalDone: number;
  activeGoals: number;
  trophiesEarned: number;
  /** dificuldade média (1–5) dos últimos 30 dias, ou null */
  avgDifficulty: number | null;
  /** janela (padrão: últimos 30 dias), do mais antigo ao mais novo */
  consistency: DayStat[];
  /** taxa de conclusão por dia da semana (0 = dom) */
  weekdays: { weekday: number; rate: number; samples: number }[];
  /** dia da semana mais forte (maior taxa), ou null */
  strongestWeekday: number | null;
  /** dificuldade média por semana, últimas 8 semanas (mais antiga → mais nova) */
  difficultyTrend: { weekStart: ISODate; avg: number | null }[];
};

export type GoalDetail = GoalWithProgress & {
  checkins: Checkin[];
  avgDifficulty: number | null;
  trophies: EarnedTrophy[];
};

export type AuthResponse = { token: string; user: User; settings: Settings; trophyCount: number };

export type MeResponse = { user: User; settings: Settings; trophyCount: number };

export type ApiErrorBody = { error: string; issues?: { path: string; message: string }[] };
