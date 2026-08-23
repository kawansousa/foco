import { TROPHIES } from "@foco/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { checkin, createGoal, createTestApp, registerUser, TODAY, type TestApp } from "./helpers/test-app";

type View = { code: string; name: string; secret?: boolean; earned: { id: string; note: string | null } | null };

describe("troféus", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  it("GET /trophies lista o catálogo inteiro, tudo por conquistar, para conta nova", async () => {
    const me = await registerUser(t.http);
    const res = await t.http.get("/trophies").set(me.auth).expect(200);
    const views: View[] = res.body.trophies;
    expect(views.map((v) => v.code)).toEqual(TROPHIES.map((d) => d.code));
    expect(views.every((v) => v.earned === null)).toBe(true);
    expect(views.find((v) => v.code === "madrugador")?.secret).toBe(true);
  });

  it("marca os conquistados com os dados da conquista", async () => {
    const me = await registerUser(t.http);
    const goal = await createGoal(t.http, me);
    await checkin(t.http, me, goal.id, TODAY, { difficulty: 5 });

    const res = await t.http.get("/trophies").set(me.auth).expect(200);
    const byCode = Object.fromEntries((res.body.trophies as View[]).map((v) => [v.code, v.earned]));
    expect(byCode.primeiro_passo).toMatchObject({ code: "primeiro_passo", goalId: goal.id, date: TODAY, note: null });
    expect(byCode.superacao).toMatchObject({ code: "superacao" });
    expect(byCode.sete_dias).toBeNull();
  });

  it("'meta batida' aparece uma vez por meta concluída no prazo", async () => {
    const me = await registerUser(t.http);
    const goals = await Promise.all(
      [1, 2, 3].map(() => createGoal(t.http, me, { startDate: "2026-03-01", dueDate: "2026-03-31" })),
    );
    for (const g of goals) await t.http.post(`/goals/${g.id}/complete`).set(me.auth).send({ date: TODAY }).expect(200);

    const res = await t.http.get("/trophies").set(me.auth).expect(200);
    const batidas = (res.body.trophies as View[]).filter((v) => v.code === "meta_batida");
    expect(batidas).toHaveLength(3);
    expect(new Set(batidas.map((v) => v.earned?.id)).size).toBe(3);
  });

  describe("PATCH /trophies/:id", () => {
    it("grava e limpa a anotação do dono", async () => {
      const me = await registerUser(t.http);
      const goal = await createGoal(t.http, me);
      const { newTrophies } = await checkin(t.http, me, goal.id, TODAY);
      const id = newTrophies[0].id;

      const saved = await t.http.patch(`/trophies/${id}`).set(me.auth).send({ note: "  Dia marcante " }).expect(200);
      expect(saved.body).toMatchObject({ id, note: "Dia marcante" });

      const cleared = await t.http.patch(`/trophies/${id}`).set(me.auth).send({ note: null }).expect(200);
      expect(cleared.body.note).toBeNull();
    });

    it("troféu de outro usuário → 404 e nada muda", async () => {
      const owner = await registerUser(t.http);
      const intruder = await registerUser(t.http);
      const goal = await createGoal(t.http, owner);
      const { newTrophies } = await checkin(t.http, owner, goal.id, TODAY);
      const id = newTrophies[0].id;

      await t.http.patch(`/trophies/${id}`).set(intruder.auth).send({ note: "invasão" }).expect(404);
      const res = await t.http.get("/trophies").set(owner.auth).expect(200);
      const mine = (res.body.trophies as View[]).find((v) => v.earned?.id === id);
      expect(mine?.earned?.note).toBeNull();
    });

    it("anotação acima de 300 caracteres → 400", async () => {
      const me = await registerUser(t.http);
      const goal = await createGoal(t.http, me);
      const { newTrophies } = await checkin(t.http, me, goal.id, TODAY);
      await t.http.patch(`/trophies/${newTrophies[0].id}`).set(me.auth).send({ note: "x".repeat(301) }).expect(400);
    });
  });
});
