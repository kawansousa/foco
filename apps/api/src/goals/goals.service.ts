import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  goalProgress,
  type CreateGoalInput,
  type EarnedTrophy,
  type Goal,
  type GoalDetail,
  type GoalStatus,
  type GoalWithProgress,
  type ISODate,
  type UpdateGoalInput,
} from "@foco/shared";
import { findCheckins } from "../checkins/checkins.query";
import { Clock } from "../common/clock/clock";
import { toGoal } from "../common/mappers";
import type { Goal as GoalRow } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { SettingsService } from "../settings/settings.service";
import { TrophiesService } from "../trophies/trophies.service";

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly trophies: TrophiesService,
    private readonly clock: Clock,
  ) {}

  /** Todas as metas do usuário, mais recentes primeiro. */
  async list(userId: string): Promise<Goal[]> {
    const rows = await this.prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map(toGoal);
  }

  /** Meta do usuário; 404 se não existir OU pertencer a outra pessoa (não vaza existência). */
  async getOwned(userId: string, goalId: string): Promise<Goal> {
    return toGoal(await this.getOwnedRow(userId, goalId));
  }

  async listWithProgress(userId: string, today: ISODate, status?: GoalStatus): Promise<GoalWithProgress[]> {
    const [goals, checkins, settings] = await Promise.all([
      this.list(userId),
      findCheckins(this.prisma, userId),
      this.settings.get(userId),
    ]);
    return goals
      .filter((g) => !status || g.status === status)
      .map((g) => ({ ...g, progress: goalProgress(g, checkins, today, settings.restDays) }));
  }

  async detail(userId: string, goalId: string, today: ISODate): Promise<GoalDetail> {
    const goal = await this.getOwned(userId, goalId);
    const [checkins, settings, trophies] = await Promise.all([
      findCheckins(this.prisma, userId, { goalId }),
      this.settings.get(userId),
      this.trophies.listEarned(userId, goalId),
    ]);
    const withDifficulty = checkins.filter((c) => c.done && c.difficulty != null);
    const avgDifficulty = withDifficulty.length
      ? Math.round((withDifficulty.reduce((s, c) => s + (c.difficulty ?? 0), 0) / withDifficulty.length) * 10) / 10
      : null;
    return {
      ...goal,
      progress: goalProgress(goal, checkins, today, settings.restDays),
      checkins,
      avgDifficulty,
      trophies,
    };
  }

  async create(userId: string, input: CreateGoalInput): Promise<GoalWithProgress> {
    const row = await this.prisma.goal.create({
      data: {
        userId,
        title: input.title,
        stepTitle: input.stepTitle,
        description: input.description ?? null,
        startDate: input.startDate,
        dueDate: input.dueDate,
        reminderTime: input.reminderTime ?? null,
      },
    });
    return this.withProgress(userId, row);
  }

  async update(userId: string, goalId: string, input: UpdateGoalInput): Promise<GoalWithProgress> {
    const existing = await this.getOwnedRow(userId, goalId);
    if (input.dueDate && input.dueDate < existing.startDate) {
      throw new BadRequestException("O prazo precisa ser depois do início.");
    }
    const row = await this.prisma.goal.update({
      where: { id: existing.id },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.stepTitle !== undefined && { stepTitle: input.stepTitle }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
        ...(input.reminderTime !== undefined && { reminderTime: input.reminderTime }),
        ...(input.status !== undefined && {
          status: input.status,
          // guarda a 1ª conclusão; reabrir/arquivar limpa
          completedAt: input.status === "done" ? (existing.completedAt ?? this.clock.now()) : null,
        }),
      },
    });
    return this.withProgress(userId, row);
  }

  /**
   * Marca a meta como concluída em `date` (hoje do cliente; sem ela, do servidor).
   * Idempotente: concluir de novo não muda a data nem gera troféu.
   * "Meta batida" só sai se foi dentro do prazo.
   */
  async complete(
    userId: string,
    goalId: string,
    date: ISODate = this.clock.todayISO(),
  ): Promise<{ goal: GoalWithProgress; newTrophies: EarnedTrophy[] }> {
    const existing = await this.getOwnedRow(userId, goalId);
    if (existing.status === "done") {
      return { goal: await this.withProgress(userId, existing), newTrophies: [] };
    }
    const goal = await this.update(userId, goalId, { status: "done" });
    const onTime = !existing.dueDate || date <= existing.dueDate;
    const newTrophies = await this.trophies.award(userId, { kind: "goal_done", date, goalId, onTime });
    return { goal, newTrophies };
  }

  /** Apaga a meta e, em cascata, seus check-ins; troféus ficam (sem meta). */
  async remove(userId: string, goalId: string): Promise<void> {
    const existing = await this.getOwnedRow(userId, goalId);
    await this.prisma.goal.delete({ where: { id: existing.id } });
  }

  private async getOwnedRow(userId: string, goalId: string): Promise<GoalRow> {
    const row = await this.prisma.goal.findFirst({ where: { id: goalId, userId } });
    if (!row) throw new NotFoundException("Meta não encontrada.");
    return row;
  }

  private async withProgress(userId: string, row: GoalRow): Promise<GoalWithProgress> {
    const goal = toGoal(row);
    const [checkins, settings] = await Promise.all([
      findCheckins(this.prisma, userId, { goalId: goal.id }),
      this.settings.get(userId),
    ]);
    return { ...goal, progress: goalProgress(goal, checkins, this.clock.todayISO(), settings.restDays) };
  }
}
