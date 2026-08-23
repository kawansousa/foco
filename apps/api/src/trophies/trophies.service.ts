import { Injectable, NotFoundException } from "@nestjs/common";
import { TROPHIES, type EarnedTrophy, type TrophyView } from "@foco/shared";
import { toTrophy } from "../common/mappers";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { trophyCandidates, type TrophyEvent } from "./trophy-rules";

@Injectable()
export class TrophiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Avalia as regras para um evento e grava os troféus ainda não conquistados.
   * Retorna só os novos. O índice único (userId, code, scopeKey) garante que
   * um troféu global não repete e que "meta batida" sai uma vez por meta.
   */
  async award(userId: string, ev: TrophyEvent): Promise<EarnedTrophy[]> {
    const awarded: EarnedTrophy[] = [];
    for (const cand of trophyCandidates(ev)) {
      try {
        const row = await this.prisma.trophy.create({
          data: { userId, code: cand.code, scopeKey: cand.scopeKey, goalId: ev.goalId, date: ev.date },
        });
        awarded.push(toTrophy(row));
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        // já conquistado: ignora
      }
    }
    return awarded;
  }

  async listEarned(userId: string, goalId?: string): Promise<EarnedTrophy[]> {
    const rows = await this.prisma.trophy.findMany({
      where: { userId, ...(goalId && { goalId }) },
      orderBy: { earnedAt: "asc" },
    });
    return rows.map(toTrophy);
  }

  async countEarned(userId: string): Promise<number> {
    return this.prisma.trophy.count({ where: { userId } });
  }

  /**
   * Catálogo completo com o estado de cada troféu para o usuário. Troféus
   * "por meta" conquistados mais de uma vez aparecem uma vez por conquista.
   */
  async listView(userId: string): Promise<TrophyView[]> {
    const earned = await this.listEarned(userId);
    const views: TrophyView[] = [];
    for (const def of TROPHIES) {
      const mine = earned.filter((t) => t.code === def.code);
      if (def.perGoal && mine.length > 1) {
        for (const e of mine) views.push({ ...def, earned: e });
      } else {
        views.push({ ...def, earned: mine[0] ?? null });
      }
    }
    return views;
  }

  /** Anotação pessoal no troféu; só o dono pode editar. */
  async updateNote(userId: string, trophyId: string, note: string | null): Promise<EarnedTrophy> {
    const { count } = await this.prisma.trophy.updateMany({ where: { id: trophyId, userId }, data: { note } });
    if (count === 0) throw new NotFoundException("Troféu não encontrado.");
    const row = await this.prisma.trophy.findUniqueOrThrow({ where: { id: trophyId } });
    return toTrophy(row);
  }
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}
