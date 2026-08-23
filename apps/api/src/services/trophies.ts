import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { TROPHY_BY_CODE, type EarnedTrophy, type ISODate, type TrophyCode } from "@foco/shared";
import { db, schema } from "../db";
import { toTrophy } from "./mappers";

export type TrophyEvent =
  | {
      kind: "checkin";
      date: ISODate;
      goalId: string;
      difficulty: number | null;
      localTime?: string;
      streak: number;
      dayComplete: boolean;
    }
  | { kind: "goal_done"; date: ISODate; goalId: string; onTime: boolean };

/**
 * Avalia as regras de troféu para um evento e grava os que ainda não foram
 * conquistados. Retorna só os novos.
 */
export function awardTrophies(userId: string, ev: TrophyEvent): EarnedTrophy[] {
  const candidates: { code: TrophyCode; goalId: string | null }[] = [];

  if (ev.kind === "checkin") {
    candidates.push({ code: "primeiro_passo", goalId: null });
    if (ev.difficulty === 5) candidates.push({ code: "superacao", goalId: null });
    if (ev.streak >= 7) candidates.push({ code: "sete_dias", goalId: null });
    if (ev.streak >= 30) candidates.push({ code: "mes_inteiro", goalId: null });
    if (ev.streak >= 100) candidates.push({ code: "cem_dias", goalId: null });
    if (ev.dayComplete) candidates.push({ code: "sem_folga", goalId: null });
    if (ev.localTime && ev.localTime < "07:00") candidates.push({ code: "madrugador", goalId: null });
  } else if (ev.onTime) {
    candidates.push({ code: "meta_batida", goalId: ev.goalId });
  }

  const awarded: EarnedTrophy[] = [];
  for (const cand of candidates) {
    const def = TROPHY_BY_CODE[cand.code];
    const scopeKey = def.perGoal ? (cand.goalId ?? "") : "";
    const row = db
      .insert(schema.trophies)
      .values({
        id: randomUUID(),
        userId,
        code: cand.code,
        goalId: ev.goalId,
        scopeKey,
        date: ev.date,
      })
      .onConflictDoNothing()
      .returning()
      .get();
    if (row) awarded.push(toTrophy(row));
  }
  return awarded;
}

export function listEarned(userId: string): EarnedTrophy[] {
  return db.select().from(schema.trophies).where(eq(schema.trophies.userId, userId)).all().map(toTrophy);
}
