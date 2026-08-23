import { DEFAULT_SETTINGS } from "@foco/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, registerUser, type TestApp } from "./helpers/test-app";

describe("configurações do Fô", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  it("GET /settings devolve os padrões para conta nova", async () => {
    const me = await registerUser(t.http);
    const res = await t.http.get("/settings").set(me.auth).expect(200);
    expect(res.body).toEqual({ ...DEFAULT_SETTINGS, restDays: [] });
  });

  it("GET /settings recria a linha se ela não existir (conta antiga / linha apagada)", async () => {
    const me = await registerUser(t.http);
    await t.prisma.settings.delete({ where: { userId: me.id } });
    const res = await t.http.get("/settings").set(me.auth).expect(200);
    expect(res.body).toEqual({ ...DEFAULT_SETTINGS, restDays: [] });
  });

  it("PUT /settings é parcial e persiste (reflete em /me)", async () => {
    const me = await registerUser(t.http);
    const res = await t.http
      .put("/settings")
      .set(me.auth)
      .send({ tone: "firme", reminderTime: "06:45", celebrateTrophies: false })
      .expect(200);
    expect(res.body).toEqual({
      ...DEFAULT_SETTINGS,
      restDays: [],
      tone: "firme",
      reminderTime: "06:45",
      celebrateTrophies: false,
    });

    const me2 = await t.http.get("/me").set(me.auth).expect(200);
    expect(me2.body.settings).toEqual(res.body);
  });

  it("restDays é normalizado: sem repetidos e em ordem", async () => {
    const me = await registerUser(t.http);
    const res = await t.http.put("/settings").set(me.auth).send({ restDays: [6, 0, 6, 3] }).expect(200);
    expect(res.body.restDays).toEqual([0, 3, 6]);
    const again = await t.http.put("/settings").set(me.auth).send({ restDays: [] }).expect(200);
    expect(again.body.restDays).toEqual([]);
  });

  it.each([
    ["horário inválido", { reminderTime: "25:00" }],
    ["tom desconhecido", { tone: "bravo" }],
    ["dia da semana fora de 0–6", { restDays: [7] }],
    ["tipo errado", { celebrateTrophies: "sim" }],
  ])("rejeita %s com 400 e issues", async (_label, body) => {
    const me = await registerUser(t.http);
    const res = await t.http.put("/settings").set(me.auth).send(body).expect(400);
    expect(res.body.issues).toBeDefined();
  });

  it("não vaza configurações entre usuários", async () => {
    const a = await registerUser(t.http);
    const b = await registerUser(t.http);
    await t.http.put("/settings").set(a.auth).send({ tone: "neutro" }).expect(200);
    const res = await t.http.get("/settings").set(b.auth).expect(200);
    expect(res.body.tone).toBe("leve");
  });
});
