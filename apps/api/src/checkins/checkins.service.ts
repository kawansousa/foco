import { BadRequestException, Injectable } from "@nestjs/common";
import { addDays, foCheckinReply, type Checkin, type CheckinResponse, type UpsertCheckinInput } from "@foco/shared";
import { Clock } from "../common/clock/clock";
import { toCheckin } from "../common/mappers";
import { GoalsService } from "../goals/goals.service";
import { PrismaService } from "../prisma/prisma.service";
import { ProgressService } from "../progress/progress.service";
import { SettingsService } from "../settings/settings.service";
import { TrophiesService } from "../trophies/trophies.service";
import { findCheckins, type CheckinFilter } from "./checkins.query";

/** Tolerância para clientes em fusos à frente do servidor. */
const FUTURE_TOLERANCE_DAYS = 1;

@Injectable()
export class CheckinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goals: GoalsService,
    private readonly settings: SettingsService,
    private readonly trophies: TrophiesService,
    private readonly progress: ProgressService,
    private readonly clock: Clock,
  ) {}

  list(userId: string, filter: CheckinFilter = {}): Promise<Checkin[]> {
    return findCheckins(this.prisma, userId, filter);
  }

  /**
   * Registra (ou atualiza) o check-in de uma meta em um dia. Há no máximo um
   * por (meta, dia). Regras:
   *  - não antes do início da meta, nem no futuro (com 1 dia de tolerância);
   *  - desmarcar zera a dificuldade, mas preserva a anotação;
   *  - marcar sem informar dificuldade mantém a anterior;
   *  - só check-ins concluídos disparam troféus.
   */
  async upsert(userId: string, input: UpsertCheckinInput): Promise<CheckinResponse> {
    const goal = await this.goals.getOwned(userId, input.goalId);
    if (input.date < goal.startDate) throw new BadRequestException("Não dá pra registrar antes do início da meta.");
    if (input.date > addDays(this.clock.todayISO(), FUTURE_TOLERANCE_DAYS)) {
      throw new BadRequestException("Não dá pra registrar no futuro.");
    }

    // Upsert atômico no índice único (meta, dia). `undefined` = "não mexe":
    // remarcar sem dificuldade mantém a anterior; nota ausente é preservada.
    const difficulty = input.done ? (input.difficulty ?? undefined) : null;
    const row = await this.prisma.checkin.upsert({
      where: { goalId_date: { goalId: input.goalId, date: input.date } },
      create: {
        userId,
        goalId: input.goalId,
        date: input.date,
        done: input.done,
        difficulty: difficulty ?? null,
        note: input.note ?? null,
      },
      update: { done: input.done, difficulty, note: input.note },
    });

    const settings = await this.settings.get(userId);
    const { steps, done, streak } = await this.progress.dayContext(userId, input.date, settings);
    const dayComplete = steps.length > 0 && done === steps.length;

    const newTrophies = input.done
      ? await this.trophies.award(userId, {
          kind: "checkin",
          date: input.date,
          goalId: input.goalId,
          difficulty: row.difficulty,
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
      fo: foCheckinReply(row.difficulty, settings.tone, input.done),
    };
  }
}
