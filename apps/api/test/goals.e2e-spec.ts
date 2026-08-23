import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkin, createGoal, createTestApp, registerUser, TODAY, type TestApp, type TestUser } from "./helpers/test-app";

describe("metas", () => {
  let t: TestApp;
  let user: TestUser;
  beforeAll(async () => {
    t = await createTestApp();
    user = await registerUser(t.http);
  });
  afterAll(() => t.close());

  describe("POST /goals", () => {
    it("cria com progresso zerado e campos opcionais nulos", async () => {
      const res = await t.http
        .post("/goals")
        .set(user.auth)
        .send({ title: " Maratona ", stepTitle: "Correr 3 km", startDate: "2026-03-01", dueDate: "2026-03-31" })
        .expect(201);

      expect(res.body).toMatchObject({
        id: expect.any(String),
        title: "Maratona",
        stepTitle: "Correr 3 km",
        description: null,
        startDate: "2026-03-01",
        dueDate: "2026-03-31",
        reminderTime: null,
        status: "active",
        completedAt: null,
      });
      expect(res.body.progress).toMatchObject({ percent: 0, doneDays: 0, daysLeft: 21, dueLabel: "21 dias" });
      expect(res.body.progress.plannedDays).toBeGreaterThan(0);
    });

    it("meta contínua (sem prazo) tem daysLeft null e rótulo 'contínua'", async () => {
      const goal = await createGoal(t.http, user, { dueDate: null });
      const res = await t.http.get(`/goals/${goal.id}?date=${TODAY}`).set(user.auth).expect(200);
      expect(res.body.progress).toMatchObject({ daysLeft: null, dueLabel: "contínua" });
    });

    it("prazo antes do início é 400 apontando o campo", async () => {
      const res = await t.http
        .post("/goals")
        .set(user.auth)
        .send({ title: "Meta", stepTitle: "Passo", startDate: "2026-03-10", dueDate: "2026-03-01" })
        .expect(400);
      expect(res.body.issues).toEqual([{ path: "dueDate", message: expect.stringMatching(/prazo/i) }]);
    });

    it("horário de lembrete inválido é 400", async () => {
      await t.http
        .post("/goals")
        .set(user.auth)
        .send({ title: "Meta", stepTitle: "Passo", startDate: "2026-03-10", dueDate: null, reminderTime: "25:00" })
        .expect(400);
    });
  });

  describe("GET /goals", () => {
    it("lista só as metas do usuário, com progresso, e filtra por status", async () => {
      const me = await registerUser(t.http);
      const other = await registerUser(t.http);
      const a = await createGoal(t.http, me, { title: "Meta A" });
      const b = await createGoal(t.http, me, { title: "Meta B" });
      await createGoal(t.http, other, { title: "De outra pessoa" });
      await t.http.patch(`/goals/${b.id}`).set(me.auth).send({ status: "archived" }).expect(200);

      const all = await t.http.get(`/goals?date=${TODAY}`).set(me.auth).expect(200);
      expect(all.body.goals.map((g: { id: string }) => g.id).sort()).toEqual([a.id, b.id].sort());
      expect(all.body.goals[0].progress).toBeDefined();

      const active = await t.http.get(`/goals?date=${TODAY}&status=active`).set(me.auth).expect(200);
      expect(active.body.goals.map((g: { id: string }) => g.id)).toEqual([a.id]);

      const archived = await t.http.get(`/goals?status=archived`).set(me.auth).expect(200);
      expect(archived.body.goals.map((g: { id: string }) => g.id)).toEqual([b.id]);
    });

    it("status desconhecido e date inválida são 400", async () => {
      await t.http.get("/goals?status=feita").set(user.auth).expect(400);
      const res = await t.http.get("/goals?date=10-03-2026").set(user.auth).expect(400);
      expect(res.body.error).toMatch(/date/);
    });
  });

  describe("GET /goals/:id", () => {
    it("detalha com check-ins, dificuldade média e troféus da meta", async () => {
      const goal = await createGoal(t.http, user, { startDate: "2026-03-01", dueDate: "2026-03-20" });
      await checkin(t.http, user, goal.id, "2026-03-08", { difficulty: 2 });
      await checkin(t.http, user, goal.id, "2026-03-09", { difficulty: 5 });
      await checkin(t.http, user, goal.id, "2026-03-10", { done: false });

      const res = await t.http.get(`/goals/${goal.id}?date=${TODAY}`).set(user.auth).expect(200);
      expect(res.body.checkins).toHaveLength(3);
      expect(res.body.checkins.map((c: { date: string }) => c.date)).toEqual(["2026-03-10", "2026-03-09", "2026-03-08"]);
      expect(res.body.avgDifficulty).toBe(3.5); // só os concluídos contam
      expect(res.body.progress).toMatchObject({ doneDays: 2, lastDoneDate: "2026-03-09" });
      expect(res.body.trophies.map((tr: { code: string }) => tr.code)).toEqual(
        expect.arrayContaining(["primeiro_passo", "superacao"]),
      );
    });

    it("meta de outro usuário ou inexistente → 404 (mesma resposta)", async () => {
      const other = await registerUser(t.http);
      const goal = await createGoal(t.http, other);
      const foreign = await t.http.get(`/goals/${goal.id}`).set(user.auth).expect(404);
      const missing = await t.http.get("/goals/nao-existe").set(user.auth).expect(404);
      expect(foreign.body).toEqual({ error: "Meta não encontrada." });
      expect(missing.body).toEqual(foreign.body);
    });
  });

  describe("PATCH /goals/:id", () => {
    it("atualiza parcialmente sem apagar o que não foi enviado", async () => {
      const goal = await createGoal(t.http, user, { title: "Original", description: "desc" } as never);
      const res = await t.http.patch(`/goals/${goal.id}`).set(user.auth).send({ stepTitle: "Novo passo" }).expect(200);
      expect(res.body).toMatchObject({ title: "Original", stepTitle: "Novo passo" });
    });

    it("status done grava completedAt (relógio da app) e voltar para active limpa", async () => {
      const goal = await createGoal(t.http, user);
      const done = await t.http.patch(`/goals/${goal.id}`).set(user.auth).send({ status: "done" }).expect(200);
      expect(done.body.completedAt).toBe("2026-03-10T12:00:00.000Z");
      expect(done.body.progress.percent).toBe(100);
      expect(done.body.progress.dueLabel).toBe("concluída");

      const reopened = await t.http.patch(`/goals/${goal.id}`).set(user.auth).send({ status: "active" }).expect(200);
      expect(reopened.body.completedAt).toBeNull();
    });

    it("prazo antes do início existente é 400", async () => {
      const goal = await createGoal(t.http, user, { startDate: "2026-02-01" });
      const res = await t.http.patch(`/goals/${goal.id}`).set(user.auth).send({ dueDate: "2026-01-15" }).expect(400);
      expect(res.body).toEqual({ error: "O prazo precisa ser depois do início." });
    });

    it("não edita meta de outro usuário", async () => {
      const other = await registerUser(t.http);
      const goal = await createGoal(t.http, other, { title: "Intocada" });
      await t.http.patch(`/goals/${goal.id}`).set(user.auth).send({ title: "Hackeada" }).expect(404);
      const check = await t.http.get(`/goals/${goal.id}`).set(other.auth).expect(200);
      expect(check.body.title).toBe("Intocada");
    });
  });

  describe("POST /goals/:id/complete", () => {
    it("no prazo: marca como concluída e dá 'meta batida' para essa meta", async () => {
      const goal = await createGoal(t.http, user, { startDate: "2026-03-01", dueDate: "2026-03-31" });
      const res = await t.http.post(`/goals/${goal.id}/complete`).set(user.auth).send({ date: TODAY }).expect(200);
      expect(res.body.goal.status).toBe("done");
      expect(res.body.newTrophies).toEqual([expect.objectContaining({ code: "meta_batida", goalId: goal.id })]);
    });

    it("atrasada: conclui, mas sem troféu", async () => {
      const goal = await createGoal(t.http, user, { startDate: "2026-01-01", dueDate: "2026-02-01" });
      const res = await t.http.post(`/goals/${goal.id}/complete`).set(user.auth).send({ date: TODAY }).expect(200);
      expect(res.body.goal.status).toBe("done");
      expect(res.body.newTrophies).toEqual([]);
    });

    it("sem corpo usa o hoje do servidor; concluir de novo é idempotente", async () => {
      const goal = await createGoal(t.http, user, { startDate: "2026-03-01", dueDate: "2026-03-31" });
      const first = await t.http.post(`/goals/${goal.id}/complete`).set(user.auth).expect(200);
      expect(first.body.newTrophies).toHaveLength(1);

      t.clock.set("2026-03-12T12:00:00.000Z");
      const again = await t.http.post(`/goals/${goal.id}/complete`).set(user.auth).expect(200);
      t.clock.set("2026-03-10T12:00:00.000Z");
      expect(again.body.newTrophies).toEqual([]);
      expect(again.body.goal.completedAt).toBe(first.body.goal.completedAt);
    });

    it("duas metas batidas geram dois troféus 'meta batida' distintos", async () => {
      const me = await registerUser(t.http);
      const g1 = await createGoal(t.http, me, { startDate: "2026-03-01", dueDate: "2026-03-31" });
      const g2 = await createGoal(t.http, me, { startDate: "2026-03-01", dueDate: "2026-03-31" });
      await t.http.post(`/goals/${g1.id}/complete`).set(me.auth).send({ date: TODAY }).expect(200);
      await t.http.post(`/goals/${g2.id}/complete`).set(me.auth).send({ date: TODAY }).expect(200);
      const res = await t.http.get("/trophies").set(me.auth).expect(200);
      const batidas = res.body.trophies.filter((tr: { code: string; earned: unknown }) => tr.code === "meta_batida" && tr.earned);
      expect(batidas).toHaveLength(2);
    });
  });

  describe("DELETE /goals/:id", () => {
    it("apaga a meta e seus check-ins; troféus ficam sem a meta", async () => {
      const me = await registerUser(t.http);
      const goal = await createGoal(t.http, me);
      await checkin(t.http, me, goal.id, TODAY, { difficulty: 5 });
      await t.http.delete(`/goals/${goal.id}`).set(me.auth).expect(204);

      await t.http.get(`/goals/${goal.id}`).set(me.auth).expect(404);
      const history = await t.http.get("/checkins").set(me.auth).expect(200);
      expect(history.body.checkins).toEqual([]);
      const trophies = await t.http.get("/trophies").set(me.auth).expect(200);
      const earned = trophies.body.trophies.filter((tr: { earned: unknown }) => tr.earned);
      expect(earned.length).toBeGreaterThan(0);
      for (const tr of earned) expect(tr.earned.goalId).toBeNull();
    });

    it("não apaga meta de outro usuário", async () => {
      const other = await registerUser(t.http);
      const goal = await createGoal(t.http, other);
      await t.http.delete(`/goals/${goal.id}`).set(user.auth).expect(404);
      await t.http.get(`/goals/${goal.id}`).set(other.auth).expect(200);
    });
  });
});
