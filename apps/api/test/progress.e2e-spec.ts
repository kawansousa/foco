import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkin, createGoal, createTestApp, registerUser, TODAY, type TestApp } from "./helpers/test-app";

// 2026-03-08 é domingo; TODAY (2026-03-10) é terça.
const SUNDAY = "2026-03-08";

describe("progresso do dia", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  describe("GET /today", () => {
    it("sem metas: nenhum passo, sequência zero e mensagem da manhã", async () => {
      const me = await registerUser(t.http);
      const res = await t.http.get(`/today?date=${TODAY}`).set(me.auth).expect(200);
      expect(res.body).toMatchObject({ date: TODAY, isRestDay: false, steps: [], doneCount: 0, total: 0, streak: 0 });
      expect(res.body.fo.kind).toBe("morning");
    });

    it("a mensagem do Fô acompanha o andamento: manhã → meio do dia → dia completo", async () => {
      const me = await registerUser(t.http, { name: "Caio" });
      const g1 = await createGoal(t.http, me, { stepTitle: "Correr" });
      const g2 = await createGoal(t.http, me, { stepTitle: "Ler" });

      const morning = await t.http.get(`/today?date=${TODAY}`).set(me.auth).expect(200);
      expect(morning.body).toMatchObject({ total: 2, doneCount: 0 });
      expect(morning.body.fo.kind).toBe("morning");
      expect(morning.body.steps.map((s: { done: boolean; checkin: unknown }) => [s.done, s.checkin])).toEqual([
        [false, null],
        [false, null],
      ]);

      await checkin(t.http, me, g1.id, TODAY);
      const midday = await t.http.get(`/today?date=${TODAY}`).set(me.auth).expect(200);
      expect(midday.body).toMatchObject({ doneCount: 1, streak: 1 });
      expect(midday.body.fo.kind).toBe("midday");
      const step1 = midday.body.steps.find((s: { goal: { id: string } }) => s.goal.id === g1.id);
      expect(step1.done).toBe(true);
      expect(step1.checkin.date).toBe(TODAY);

      await checkin(t.http, me, g2.id, TODAY);
      const complete = await t.http.get(`/today?date=${TODAY}`).set(me.auth).expect(200);
      expect(complete.body.fo.kind).toBe("day_complete");
    });

    it("só metas ativas e já iniciadas entram no dia", async () => {
      const me = await registerUser(t.http);
      const active = await createGoal(t.http, me, { title: "Ativa" });
      const future = await createGoal(t.http, me, { title: "Começa depois", startDate: "2026-04-01" });
      const done = await createGoal(t.http, me, { title: "Concluída" });
      const archived = await createGoal(t.http, me, { title: "Arquivada" });
      await t.http.patch(`/goals/${done.id}`).set(me.auth).send({ status: "done" }).expect(200);
      await t.http.patch(`/goals/${archived.id}`).set(me.auth).send({ status: "archived" }).expect(200);

      const res = await t.http.get(`/today?date=${TODAY}`).set(me.auth).expect(200);
      expect(res.body.steps.map((s: { goal: { id: string } }) => s.goal.id)).toEqual([active.id]);
      expect(res.body.steps.map((s: { goal: { id: string } }) => s.goal.id)).not.toContain(future.id);
    });

    it("dia de descanso com 'silêncio' ligado: mensagem de descanso", async () => {
      const me = await registerUser(t.http);
      await createGoal(t.http, me);
      await t.http.put("/settings").set(me.auth).send({ restDays: [0] }).expect(200);

      const res = await t.http.get(`/today?date=${SUNDAY}`).set(me.auth).expect(200);
      expect(res.body.isRestDay).toBe(true);
      expect(res.body.fo.kind).toBe("rest_day");

      await t.http.put("/settings").set(me.auth).send({ quietOnRestDays: false }).expect(200);
      const loud = await t.http.get(`/today?date=${SUNDAY}`).set(me.auth).expect(200);
      expect(loud.body.isRestDay).toBe(true);
      expect(loud.body.fo.kind).toBe("morning");
    });

    it("sem ?date usa o hoje do servidor", async () => {
      const me = await registerUser(t.http);
      const res = await t.http.get("/today").set(me.auth).expect(200);
      expect(res.body.date).toBe(TODAY);
    });
  });

  describe("GET /fo/schedule", () => {
    it("com metas: manhã, meio do dia e alerta de sequência nos horários configurados", async () => {
      const me = await registerUser(t.http);
      await createGoal(t.http, me);
      await t.http
        .put("/settings")
        .set(me.auth)
        .send({ reminderTime: "07:15", middayTime: "12:30", streakAlertTime: "21:00", tone: "firme" })
        .expect(200);

      const res = await t.http.get(`/fo/schedule?date=${TODAY}`).set(me.auth).expect(200);
      expect(res.body.date).toBe(TODAY);
      expect(res.body.messages.map((m: { kind: string; time: string }) => [m.kind, m.time])).toEqual([
        ["morning", "07:15"],
        ["midday", "12:30"],
        ["streak_risk", "21:00"],
      ]);
    });

    it("sem metas não agenda alerta de sequência", async () => {
      const me = await registerUser(t.http);
      const res = await t.http.get(`/fo/schedule?date=${TODAY}`).set(me.auth).expect(200);
      expect(res.body.messages.map((m: { kind: string }) => m.kind)).toEqual(["morning", "midday"]);
    });

    it("dia de descanso silencioso agenda só a mensagem de descanso", async () => {
      const me = await registerUser(t.http);
      await createGoal(t.http, me);
      await t.http.put("/settings").set(me.auth).send({ restDays: [0] }).expect(200);
      const res = await t.http.get(`/fo/schedule?date=${SUNDAY}`).set(me.auth).expect(200);
      expect(res.body.messages).toEqual([expect.objectContaining({ kind: "rest_day", time: "08:00" })]);
    });
  });

  describe("GET /stats", () => {
    it("consolida sequência, totais, troféus e séries dos últimos dias", async () => {
      const me = await registerUser(t.http);
      const g1 = await createGoal(t.http, me);
      const g2 = await createGoal(t.http, me);
      await t.http.patch(`/goals/${g2.id}`).set(me.auth).send({ status: "archived" }).expect(200);
      await checkin(t.http, me, g1.id, "2026-03-08", { difficulty: 2 });
      await checkin(t.http, me, g1.id, "2026-03-09", { difficulty: 4 });
      await checkin(t.http, me, g1.id, TODAY, { difficulty: 3 });

      const res = await t.http.get(`/stats?date=${TODAY}`).set(me.auth).expect(200);
      expect(res.body).toMatchObject({
        streak: 3,
        bestStreak: 3,
        totalDone: 3,
        activeGoals: 1,
        trophiesEarned: 2, // primeiro_passo + sem_folga
        avgDifficulty: 3,
        strongestWeekday: expect.any(Number),
      });
      expect(res.body.consistency).toHaveLength(30);
      expect(res.body.consistency.at(-1)).toEqual({ date: TODAY, done: 1, total: 1, rest: false });
      expect(res.body.weekdays).toHaveLength(7);
      expect(res.body.difficultyTrend).toHaveLength(8);
    });

    it("usuário novo tem tudo zerado sem erro", async () => {
      const me = await registerUser(t.http);
      const res = await t.http.get("/stats").set(me.auth).expect(200);
      expect(res.body).toMatchObject({ streak: 0, bestStreak: 0, totalDone: 0, activeGoals: 0, trophiesEarned: 0, avgDifficulty: null });
    });
  });
});
