import type { Checkin, ISODate } from "@foco/shared";
import { toCheckin } from "../common/mappers";
import type { PrismaService } from "../prisma/prisma.service";

export type CheckinFilter = { from?: ISODate; to?: ISODate; goalId?: string };

/**
 * Consulta de check-ins do usuário (mais recentes primeiro). Função solta para
 * ser reutilizada por `CheckinsService` e `ProgressService` sem dependência
 * circular entre os módulos.
 */
export async function findCheckins(prisma: PrismaService, userId: string, f: CheckinFilter = {}): Promise<Checkin[]> {
  const rows = await prisma.checkin.findMany({
    where: {
      userId,
      ...(f.goalId && { goalId: f.goalId }),
      ...((f.from || f.to) && { date: { ...(f.from && { gte: f.from }), ...(f.to && { lte: f.to }) } }),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toCheckin);
}
