import { describe, expect, it } from "vitest";
import { trophyCandidates, type TrophyEvent } from "./trophy-rules";

const codes = (ev: TrophyEvent) => trophyCandidates(ev).map((c) => c.code);

const checkin = (over: Partial<Extract<TrophyEvent, { kind: "checkin" }>> = {}): TrophyEvent => ({
  kind: "checkin",
  date: "2026-03-10",
  goalId: "g1",
  difficulty: 3,
  streak: 1,
  dayComplete: false,
  ...over,
});

describe("trophyCandidates — check-in", () => {
  it("todo check-in concluído conta como 'primeiro passo' (a deduplicação é de quem grava)", () => {
    expect(codes(checkin())).toEqual(["primeiro_passo"]);
  });

  it("dificuldade 5 dá 'superação'; 4 não", () => {
    expect(codes(checkin({ difficulty: 5 }))).toContain("superacao");
    expect(codes(checkin({ difficulty: 4 }))).not.toContain("superacao");
    expect(codes(checkin({ difficulty: null }))).not.toContain("superacao");
  });

  it("sequência desbloqueia 7, 30 e 100 dias de forma cumulativa", () => {
    expect(codes(checkin({ streak: 6 }))).not.toContain("sete_dias");
    expect(codes(checkin({ streak: 7 }))).toContain("sete_dias");
    expect(codes(checkin({ streak: 30 }))).toEqual(expect.arrayContaining(["sete_dias", "mes_inteiro"]));
    expect(codes(checkin({ streak: 30 }))).not.toContain("cem_dias");
    expect(codes(checkin({ streak: 100 }))).toEqual(
      expect.arrayContaining(["sete_dias", "mes_inteiro", "cem_dias"]),
    );
  });

  it("dia completo dá 'sem folga'", () => {
    expect(codes(checkin({ dayComplete: true }))).toContain("sem_folga");
    expect(codes(checkin({ dayComplete: false }))).not.toContain("sem_folga");
  });

  it("'madrugador' só antes das 07:00 e só quando o cliente informa a hora", () => {
    expect(codes(checkin({ localTime: "06:59" }))).toContain("madrugador");
    expect(codes(checkin({ localTime: "07:00" }))).not.toContain("madrugador");
    expect(codes(checkin({ localTime: "23:30" }))).not.toContain("madrugador");
    expect(codes(checkin({ localTime: undefined }))).not.toContain("madrugador");
  });

  it("troféus globais têm escopo vazio", () => {
    for (const c of trophyCandidates(checkin({ difficulty: 5, streak: 100, dayComplete: true, localTime: "05:00" }))) {
      expect(c.scopeKey).toBe("");
    }
  });
});

describe("trophyCandidates — meta concluída", () => {
  it("no prazo dá 'meta batida' com escopo da meta (um por meta)", () => {
    expect(trophyCandidates({ kind: "goal_done", date: "2026-03-10", goalId: "g9", onTime: true })).toEqual([
      { code: "meta_batida", scopeKey: "g9" },
    ]);
  });

  it("fora do prazo não dá nada", () => {
    expect(trophyCandidates({ kind: "goal_done", date: "2026-03-10", goalId: "g9", onTime: false })).toEqual([]);
  });
});
