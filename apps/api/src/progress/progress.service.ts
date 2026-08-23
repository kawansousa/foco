import { Injectable } from "@nestjs/common";
import {
  computeStats,
  currentStreak,
  foMessage,
  goalActiveOn,
  isRestDay,
  type FoContext,
  type FoMessage,
  type ISODate,
  type Settings,
  type StatsResponse,
  type TodayResponse,
  type TodayStep,
} from "@foco/shared";
import { findCheckins } from "../checkins/checkins.query";
import { GoalsService } from "../goals/goals.service";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { TrophiesService } from "../trophies/trophies.service";
import { UsersService } from "../users/users.service";

/** Estado do dia de um usuário: passos previstos, quantos foram feitos e a sequência. */
export type DayContext = {
  steps: TodayStep[];
  done: number;
  streak: number;
  /** contexto pronto para as mensagens do Fô */
  fo: FoContext;
};

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goals: GoalsService,
    private readonly settings: SettingsService,
    private readonly users: UsersService,
    private readonly trophies: TrophiesService,
  ) {}

  async dayContext(userId: string, date: ISODate, settings: Settings): Promise<DayContext> {
    const [allGoals, allCheckins, user] = await Promise.all([
      this.goals.list(userId),
      findCheckins(this.prisma, userId),
      this.users.getById(userId),
    ]);
    const goals = allGoals.filter((g) => g.status === "active" && goalActiveOn(g, date));
    const byGoal = new Map(allCheckins.filter((c) => c.date === date).map((c) => [c.goalId, c]));

    const steps: TodayStep[] = goals.map((goal) => {
      const checkin = byGoal.get(goal.id) ?? null;
      return { goal, checkin, done: checkin?.done ?? false };
    });
    const done = steps.filter((s) => s.done).length;
    const nextStep = steps.find((s) => !s.done)?.goal.stepTitle ?? steps[0]?.goal.stepTitle ?? null;
    const streak = currentStreak(allCheckins, date, settings.restDays);

    return {
      steps,
      done,
      streak,
      fo: { name: user.name, tone: settings.tone, total: steps.length, done, streak, nextStep },
    };
  }

  /** Tela "Hoje": passos do dia e a mensagem do Fô adequada ao momento. */
  async today(userId: string, date: ISODate): Promise<TodayResponse> {
    const settings = await this.settings.get(userId);
    const { steps, done, streak, fo: ctx } = await this.dayContext(userId, date, settings);
    const rest = isRestDay(date, settings.restDays);

    let fo: FoMessage;
    if (rest && settings.quietOnRestDays) fo = foMessage("rest_day", ctx);
    else if (steps.length > 0 && done === steps.length) fo = foMessage("day_complete", ctx);
    else if (done > 0) fo = foMessage("midday", ctx);
    else fo = foMessage("morning", ctx);

    return { date, isRestDay: rest, steps, doneCount: done, total: steps.length, streak, fo };
  }

  /** Agenda de mensagens do Fô para o dia — o app usa para agendar notificações locais. */
  async foSchedule(userId: string, date: ISODate): Promise<FoMessage[]> {
    const settings = await this.settings.get(userId);
    const { fo: ctx } = await this.dayContext(userId, date, settings);

    if (isRestDay(date, settings.restDays) && settings.quietOnRestDays) {
      return [foMessage("rest_day", { ...ctx, time: settings.reminderTime })];
    }
    const messages: FoMessage[] = [
      foMessage("morning", { ...ctx, time: settings.reminderTime }),
      foMessage("midday", { ...ctx, time: settings.middayTime }),
    ];
    if (ctx.total > 0) messages.push(foMessage("streak_risk", { ...ctx, time: settings.streakAlertTime }));
    return messages;
  }

  async stats(userId: string, today: ISODate, from?: ISODate): Promise<StatsResponse> {
    const [goals, checkins, settings, trophiesEarned] = await Promise.all([
      this.goals.list(userId),
      findCheckins(this.prisma, userId),
      this.settings.get(userId),
      this.trophies.countEarned(userId),
    ]);
    return computeStats(goals, checkins, today, settings.restDays, { trophiesEarned, from });
  }
}
