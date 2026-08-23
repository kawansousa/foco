import { TROPHY_BY_CODE, type ISODate, type TrophyCode } from "@foco/shared";

/** Evento que pode desbloquear troféus. */
export type TrophyEvent =
  | {
      kind: "checkin";
      date: ISODate;
      goalId: string;
      difficulty: number | null;
      /** hora local do cliente (HH:MM) no momento do registro */
      localTime?: string;
      /** sequência atual já considerando este check-in */
      streak: number;
      /** todos os passos do dia concluídos */
      dayComplete: boolean;
    }
  | { kind: "goal_done"; date: ISODate; goalId: string; onTime: boolean };

export type TrophyCandidate = {
  code: TrophyCode;
  /** chave de escopo: goalId para troféus "por meta", "" para os globais */
  scopeKey: string;
};

export const EARLY_BIRD_LIMIT = "07:00";

/**
 * Regras de desbloqueio — função pura: dado um evento, quais troféus ele
 * justifica. Quem chama decide o que já foi conquistado.
 */
export function trophyCandidates(ev: TrophyEvent): TrophyCandidate[] {
  const codes: TrophyCode[] = [];

  if (ev.kind === "checkin") {
    codes.push("primeiro_passo");
    if (ev.difficulty === 5) codes.push("superacao");
    if (ev.streak >= 7) codes.push("sete_dias");
    if (ev.streak >= 30) codes.push("mes_inteiro");
    if (ev.streak >= 100) codes.push("cem_dias");
    if (ev.dayComplete) codes.push("sem_folga");
    if (ev.localTime && ev.localTime < EARLY_BIRD_LIMIT) codes.push("madrugador");
  } else if (ev.onTime) {
    codes.push("meta_batida");
  }

  return codes.map((code) => ({ code, scopeKey: TROPHY_BY_CODE[code].perGoal ? ev.goalId : "" }));
}
