import { addDays } from "@foco/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkin, createGoal, createTestApp, registerUser, TODAY, type TestApp, type TestUser } from "./helpers/test-app";

const codes = (trophies: { code: string }[]) => trophies.map((tr) => tr.code).sort();

describe("check-ins", () => {
  let t: TestApp;
  let user: TestUser;
  beforeAll(async () => {
    t = await createTestApp();
    user = await registerUser(t.http);
  });
  afterAll(() => t.close());

  describe("PUT /checkins — criar e atualizar", () => {
    it("cria o check-in do dia com resposta do Fô, sequência e troféu de primeiro passo", async () => {
      const me = await registerUser(t.http, { name: "Bia" });
      const goal = await createGoal(t.http, me);
      const res = await checkin(t.http, me, goal.id, TODAY, { difficulty: 3, note: "Foi ok" });

      expect(res.checkin).toMatchObject({ goalId: goal.id, date: TODAY, done: true, difficulty: 3, note: "Foi ok" });
      expect(res.streak).toBe(1);
      expect(res.dayComplete).toBe(true); // única meta do dia
      expect(res.fo).toMatchObject({ kind: "checkin", title: expect.any(String), text: expect.any(String) });
      expect(codes(res.newTrophies)).toEqual(["primeiro_passo", "sem_folga"]);
    });

    it("é idempotente: o mesmo (meta, dia) atualiza o registro em vez de duplicar", async () => {
      const goal = await createGoal(t.http, user);
      const first = await checkin(t.http, user, goal.id, "2026-03-05", { difficulty: 2 });
      const second = await checkin(t.http, user, goal.id, "2026-03-05", { difficulty: 4 });
      expect(second.checkin.id).toBe(first.checkin.id);
      expect(second.checkin.difficulty).toBe(4);

      const history = await t.http.get(`/checkins?goalId=${goal.id}`).set(user.auth).expect(200);
      expect(history.body.checkins).toHaveLength(1);
    });

    it("desmarcar zera a dificuldade mas preserva a anotação; remarcar sem dificuldade recupera a anterior", async () => {
      const goal = await createGoal(t.http, user);
      await checkin(t.http, user, goal.id, "2026-03-06", { difficulty: 5, note: "Difícil" });

      const undone = await checkin(t.http, user, goal.id, "2026-03-06", { done: false });
      expect(undone.checkin).toMatchObject({ done: false, difficulty: null, note: "Difícil" });
      expect(undone.newTrophies).toEqual([]);

      const redone = await checkin(t.http, user, goal.id, "2026-03-06");
      // dificuldade anterior (5) foi apagada ao desmarcar: agora não há o que recuperar
      expect(redone.checkin).toMatchObject({ done: true, difficulty: null, note: "Difícil" });

      const keep = await checkin(t.http, user, goal.id, "2026-03-06", { difficulty: 2 });
      const again = await checkin(t.http, user, goal.id, "2026-03-06");
      expect(keep.checkin.difficulty).toBe(2);
      expect(again.checkin.difficulty).toBe(2);
    });

    it("note: null limpa a anotação; note ausente mantém", async () => {
      const goal = await createGoal(t.http, user);
      await checkin(t.http, user, goal.id, "2026-03-07", { note: "algo" });
      expect((await checkin(t.http, user, goal.id, "2026-03-07")).checkin.note).toBe("algo");
      expect((await checkin(t.http, user, goal.id, "2026-03-07", { note: null })).checkin.note).toBeNull();
    });
  });

  describe("PUT /checkins — regras de data", () => {
    it("antes do início da meta → 400", async () => {
      const goal = await createGoal(t.http, user, { startDate: "2026-03-01" });
      const res = await t.http
        .put("/checkins")
        .set(user.auth)
        .send({ goalId: goal.id, date: "2026-02-28", done: true })
        .expect(400);
      expect(res.body).toEqual({ error: "Não dá pra registrar antes do início da meta." });
    });

    it("amanhã é tolerado (fuso à frente); depois de amanhã → 400", async () => {
      const goal = await createGoal(t.http, user);
      await checkin(t.http, user, goal.id, addDays(TODAY, 1));
      const res = await t.http
        .put("/checkins")
        .set(user.auth)
        .send({ goalId: goal.id, date: addDays(TODAY, 2), done: true })
        .expect(400);
      expect(res.body).toEqual({ error: "Não dá pra registrar no futuro." });
    });

    it("a regra de futuro segue o relógio da aplicação", async () => {
      const goal = await createGoal(t.http, user);
      t.clock.set("2026-03-20T12:00:00.000Z");
      await checkin(t.http, user, goal.id, "2026-03-21");
      t.clock.set("2026-03-10T12:00:00.000Z");
    });

    it("validação do corpo: data malformada, dificuldade fora de 1–5, hora local inválida", async () => {
      const goal = await createGoal(t.http, user);
      const bad = [
        { goalId: goal.id, date: "10/03/2026", done: true },
        { goalId: goal.id, date: TODAY, done: true, difficulty: 6 },
        { goalId: goal.id, date: TODAY, done: true, difficulty: 0 },
        { goalId: goal.id, date: TODAY, done: true, localTime: "7h" },
        { goalId: goal.id, date: TODAY },
      ];
      for (const body of bad) {
        const res = await t.http.put("/checkins").set(user.auth).send(body);
        expect(res.status, JSON.stringify(body)).toBe(400);
        expect(res.body.issues).toBeDefined();
      }
    });

    it("meta de outro usuário → 404, sem criar nada", async () => {
      const other = await registerUser(t.http);
      const goal = await createGoal(t.http, other);
      await t.http.put("/checkins").set(user.auth).send({ goalId: goal.id, date: TODAY, done: true }).expect(404);
      const history = await t.http.get("/checkins").set(other.auth).expect(200);
      expect(history.body.checkins).toEqual([]);
    });
  });

  describe("PUT /checkins — troféus", () => {
    it("troféus globais não repetem em check-ins seguintes", async () => {
      const me = await registerUser(t.http);
      const goal = await createGoal(t.http, me);
      const first = await checkin(t.http, me, goal.id, "2026-03-08", { difficulty: 5, localTime: "06:00" });
      expect(codes(first.newTrophies)).toEqual(["madrugador", "primeiro_passo", "sem_folga", "superacao"]);

      const second = await checkin(t.http, me, goal.id, "2026-03-09", { difficulty: 5, localTime: "06:00" });
      expect(second.newTrophies).toEqual([]);
    });

    it("'madrugador' exige hora local antes das 07:00", async () => {
      const me = await registerUser(t.http);
      const goal = await createGoal(t.http, me);
      const late = await checkin(t.http, me, goal.id, "2026-03-08", { localTime: "07:00" });
      expect(codes(late.newTrophies)).not.toContain("madrugador");
      const early = await checkin(t.http, me, goal.id, "2026-03-09", { localTime: "06:59" });
      expect(codes(early.newTrophies)).toEqual(["madrugador"]);
    });

    it("'sem folga' só quando TODOS os passos do dia estão feitos", async () => {
      const me = await registerUser(t.http);
      const g1 = await createGoal(t.http, me);
      const g2 = await createGoal(t.http, me);
      const half = await checkin(t.http, me, g1.id, TODAY);
      expect(half.dayComplete).toBe(false);
      expect(codes(half.newTrophies)).toEqual(["primeiro_passo"]);

      const full = await checkin(t.http, me, g2.id, TODAY);
      expect(full.dayComplete).toBe(true);
      expect(codes(full.newTrophies)).toEqual(["sem_folga"]);
    });

    it("'7 dias seguidos' no sétimo dia consecutivo; dias de descanso não quebram a sequência", async () => {
      const me = await registerUser(t.http);
      await t.http.put("/settings").set(me.auth).send({ restDays: [0] }).expect(200); // domingo
      const goal = await createGoal(t.http, me);
      // 2026-03-01 é domingo: sequência de 02 (seg) a 07 (sáb) = 6 dias, pula 08 (dom), 09 (seg) = 7º
      for (const d of ["2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05", "2026-03-06", "2026-03-07"]) {
        const r = await checkin(t.http, me, goal.id, d);
        expect(codes(r.newTrophies)).not.toContain("sete_dias");
      }
      const seventh = await checkin(t.http, me, goal.id, "2026-03-09");
      expect(seventh.streak).toBe(7);
      expect(codes(seventh.newTrophies)).toEqual(["sete_dias"]);
    });

    it("um dia útil sem check-in zera a sequência", async () => {
      const me = await registerUser(t.http);
      const goal = await createGoal(t.http, me);
      await checkin(t.http, me, goal.id, "2026-03-06");
      await checkin(t.http, me, goal.id, "2026-03-07");
      // 08 ficou em branco
      const r = await checkin(t.http, me, goal.id, "2026-03-09");
      expect(r.streak).toBe(1);
    });
  });

  describe("GET /checkins", () => {
    it("filtra por período e por meta, mais recentes primeiro", async () => {
      const me = await registerUser(t.http);
      const g1 = await createGoal(t.http, me);
      const g2 = await createGoal(t.http, me);
      await checkin(t.http, me, g1.id, "2026-03-01");
      await checkin(t.http, me, g1.id, "2026-03-05");
      await checkin(t.http, me, g2.id, "2026-03-05");
      await checkin(t.http, me, g1.id, "2026-03-09");

      const all = await t.http.get("/checkins").set(me.auth).expect(200);
      expect(all.body.checkins.map((c: { date: string }) => c.date)).toEqual(["2026-03-09", "2026-03-05", "2026-03-05", "2026-03-01"]);

      const window = await t.http.get("/checkins?from=2026-03-02&to=2026-03-08").set(me.auth).expect(200);
      expect(window.body.checkins).toHaveLength(2);

      const byGoal = await t.http.get(`/checkins?goalId=${g2.id}`).set(me.auth).expect(200);
      expect(byGoal.body.checkins).toEqual([expect.objectContaining({ goalId: g2.id, date: "2026-03-05" })]);
    });

    it("from/to inválidos → 400 citando o parâmetro", async () => {
      const res = await t.http.get("/checkins?from=ontem").set(user.auth).expect(400);
      expect(res.body.error).toMatch(/from/);
      await t.http.get("/checkins?to=2026-99-01").set(user.auth).expect(400);
    });
  });
});
