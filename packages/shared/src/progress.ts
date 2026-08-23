import { addDays, diffDays, eachDay, formatDue, weekdayOf, type ISODate } from "./dates";
import type { Checkin, DayStat, Goal, GoalProgress, StatsResponse } from "./types";

/**
 * Regras de progresso, sequência e estatísticas. Funções puras — a API usa,
 * e o app pode reutilizar para calcular coisas localmente.
 */

export type DoneCheckin = Pick<Checkin, "goalId" | "date" | "done" | "difficulty">;

export const isRestDay = (date: ISODate, restDays: number[]) => restDays.includes(weekdayOf(date));

/** Datas (únicas) com pelo menos um passo concluído. */
export function doneDates(checkins: DoneCheckin[]): Set<ISODate> {
  const s = new Set<ISODate>();
  for (const c of checkins) if (c.done) s.add(c.date);
  return s;
}

/**
 * Sequência atual: dias consecutivos (até hoje) com pelo menos um passo feito.
 * Dias de descanso não quebram nem somam. Hoje ainda não feito não quebra.
 */
export function currentStreak(checkins: DoneCheckin[], today: ISODate, restDays: number[]): number {
  const dates = doneDates(checkins);
  let streak = 0;
  let cur = today;
  // hoje: conta se feito; se não feito, só segue pro dia anterior
  if (dates.has(cur)) streak++;
  cur = addDays(cur, -1);
  for (let i = 0; i < 3660; i++) {
    if (dates.has(cur)) streak++;
    else if (!isRestDay(cur, restDays)) break;
    cur = addDays(cur, -1);
  }
  return streak;
}

/** Maior sequência já alcançada. */
export function bestStreak(checkins: DoneCheckin[], today: ISODate, restDays: number[]): number {
  const dates = doneDates(checkins);
  if (dates.size === 0) return 0;
  const first = [...dates].sort()[0];
  let best = 0;
  let run = 0;
  for (const d of eachDay(first, today)) {
    if (dates.has(d)) {
      run++;
      best = Math.max(best, run);
    } else if (!isRestDay(d, restDays)) {
      run = 0;
    }
  }
  return best;
}

function plannedDaysBetween(from: ISODate, to: ISODate, restDays: number[]): number {
  if (to < from) return 0;
  let n = 0;
  for (const d of eachDay(from, to)) if (!isRestDay(d, restDays)) n++;
  return Math.max(1, n);
}

export function goalProgress(goal: Goal, checkins: DoneCheckin[], today: ISODate, restDays: number[]): GoalProgress {
  const mine = checkins.filter((c) => c.goalId === goal.id && c.done);
  const dates = [...new Set(mine.map((c) => c.date))].sort();
  const lastDoneDate = dates.length ? dates[dates.length - 1] : null;

  let plannedDays: number;
  let doneDays: number;
  let daysLeft: number | null = null;

  if (goal.dueDate) {
    plannedDays = plannedDaysBetween(goal.startDate, goal.dueDate, restDays);
    doneDays = dates.filter((d) => d >= goal.startDate && d <= goal.dueDate!).length;
    daysLeft = diffDays(today, goal.dueDate);
  } else {
    // meta contínua: janela dos últimos 30 dias (a partir do início da meta)
    const windowStart = addDays(today, -29) > goal.startDate ? addDays(today, -29) : goal.startDate;
    plannedDays = plannedDaysBetween(windowStart, today, restDays);
    doneDays = dates.filter((d) => d >= windowStart && d <= today).length;
  }

  const percent = goal.status === "done" ? 100 : Math.min(100, Math.round((doneDays / plannedDays) * 100));

  return {
    percent,
    doneDays,
    plannedDays,
    daysLeft,
    dueLabel: goal.status === "done" ? "concluída" : formatDue(goal.dueDate, today),
    lastDoneDate,
  };
}

/** A meta tem passo previsto nesse dia? */
export function goalActiveOn(goal: Goal, date: ISODate): boolean {
  if (goal.status === "archived") return false;
  if (date < goal.startDate) return false;
  if (goal.status === "done" && goal.completedAt && date > goal.completedAt.slice(0, 10)) return false;
  if (goal.dueDate && date > goal.dueDate && goal.status === "done") return false;
  return true;
}

export function computeStats(
  goals: Goal[],
  checkins: DoneCheckin[],
  today: ISODate,
  restDays: number[],
  extra: { trophiesEarned: number },
): StatsResponse {
  const done = checkins.filter((c) => c.done);
  const byDate = new Map<ISODate, DoneCheckin[]>();
  for (const c of done) {
    const arr = byDate.get(c.date) ?? [];
    arr.push(c);
    byDate.set(c.date, arr);
  }

  const dayStat = (date: ISODate): DayStat => {
    const total = goals.filter((g) => goalActiveOn(g, date)).length;
    const d = (byDate.get(date) ?? []).length;
    return { date, done: Math.min(d, Math.max(total, d)), total, rest: isRestDay(date, restDays) };
  };

  const consistency = eachDay(addDays(today, -29), today).map(dayStat);

  // dias fortes: últimas 12 semanas
  const buckets = Array.from({ length: 7 }, () => ({ done: 0, total: 0, samples: 0 }));
  for (const date of eachDay(addDays(today, -83), today)) {
    const s = dayStat(date);
    if (s.rest || s.total === 0) continue;
    const b = buckets[weekdayOf(date)];
    b.done += s.done;
    b.total += s.total;
    b.samples++;
  }
  const weekdays = buckets.map((b, weekday) => ({
    weekday,
    rate: b.total ? Math.round((b.done / b.total) * 100) / 100 : 0,
    samples: b.samples,
  }));
  const withSamples = weekdays.filter((w) => w.samples > 0);
  const strongestWeekday = withSamples.length
    ? withSamples.reduce((a, b) => (b.rate > a.rate ? b : a)).weekday
    : null;

  // dificuldade média (30 dias)
  const recent = done.filter((c) => c.date >= addDays(today, -29) && c.difficulty != null);
  const avgDifficulty = recent.length
    ? Math.round((recent.reduce((s, c) => s + (c.difficulty ?? 0), 0) / recent.length) * 10) / 10
    : null;

  // tendência de dificuldade por semana (8 semanas, semana começa na segunda)
  const mondayOf = (d: ISODate) => addDays(d, -((weekdayOf(d) + 6) % 7));
  const thisMonday = mondayOf(today);
  const difficultyTrend = Array.from({ length: 8 }, (_, i) => {
    const weekStart = addDays(thisMonday, -7 * (7 - i));
    const weekEnd = addDays(weekStart, 6);
    const ws = done.filter((c) => c.date >= weekStart && c.date <= weekEnd && c.difficulty != null);
    const avg = ws.length ? Math.round((ws.reduce((s, c) => s + (c.difficulty ?? 0), 0) / ws.length) * 10) / 10 : null;
    return { weekStart, avg };
  });

  return {
    streak: currentStreak(checkins, today, restDays),
    bestStreak: bestStreak(checkins, today, restDays),
    totalDone: done.length,
    activeGoals: goals.filter((g) => g.status === "active").length,
    trophiesEarned: extra.trophiesEarned,
    avgDifficulty,
    consistency,
    weekdays,
    strongestWeekday,
    difficultyTrend,
  };
}
