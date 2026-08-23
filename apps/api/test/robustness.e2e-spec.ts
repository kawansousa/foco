import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkin, createGoal, createTestApp, registerUser, TODAY, type TestApp } from "./helpers/test-app";

/**
 * Casos de borda levantados na revisão de código: entradas inesperadas e
 * concorrência nunca podem virar 500.
 */
describe("robustez", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  it("query param repetido (?goalId=a&goalId=b) é 400, não 500", async () => {
    const me = await registerUser(t.http);
    const res = await t.http.get("/checkins?goalId=a&goalId=b").set(me.auth).expect(400);
    expect(res.body.error).toEqual(expect.any(String));
    await t.http.get("/goals?status=active&status=done").set(me.auth).expect(400);
    await t.http.get("/today?date=2026-03-10&date=2026-03-11").set(me.auth).expect(400);
  });

  it("token de usuário apagado é 401 em qualquer rota (inclusive escrita), nunca 500", async () => {
    const me = await registerUser(t.http);
    await t.prisma.user.delete({ where: { id: me.id } });
    for (const [method, path, body] of [
      ["get", "/me", undefined],
      ["post", "/goals", { title: "Meta", stepTitle: "Passo", startDate: TODAY, dueDate: null }],
      ["get", "/today", undefined],
      ["put", "/settings", { tone: "firme" }],
      ["get", "/stats", undefined],
    ] as const) {
      const res = await t.http[method](path).set(me.auth).send(body);
      expect(res.status, `${method.toUpperCase()} ${path}`).toBe(401);
      expect(res.body).toEqual({ error: "Faça login para continuar." });
    }
  });

  it("dois PUT /checkins simultâneos para o mesmo (meta, dia) não duplicam nem dão 500", async () => {
    const me = await registerUser(t.http);
    const goal = await createGoal(t.http, me);
    const results = await Promise.all(
      [1, 2, 3, 4].map((difficulty) =>
        t.http.put("/checkins").set(me.auth).send({ goalId: goal.id, date: TODAY, done: true, difficulty }),
      ),
    );
    for (const r of results) expect(r.status).toBe(200);
    const ids = new Set(results.map((r) => r.body.checkin.id));
    expect(ids.size).toBe(1);
    const history = await t.http.get(`/checkins?goalId=${goal.id}`).set(me.auth).expect(200);
    expect(history.body.checkins).toHaveLength(1);
  });

  it("upsert preserva dificuldade/anotação também no caminho atômico", async () => {
    const me = await registerUser(t.http);
    const goal = await createGoal(t.http, me);
    await checkin(t.http, me, goal.id, TODAY, { difficulty: 4, note: "ok" });
    const again = await checkin(t.http, me, goal.id, TODAY);
    expect(again.checkin).toMatchObject({ difficulty: 4, note: "ok" });
  });

  it("cadastros simultâneos com o mesmo e-mail: exatamente um 201, os outros 409", async () => {
    const input = { name: "Corrida", email: "corrida@exemplo.com", password: "senha-forte-123" };
    const results = await Promise.all([1, 2, 3].map(() => t.http.post("/auth/register").send(input)));
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409]);
    const users = await t.prisma.user.findMany({ where: { email: input.email } });
    expect(users).toHaveLength(1);
  });
});
