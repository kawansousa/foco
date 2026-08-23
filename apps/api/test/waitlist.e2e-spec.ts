import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./helpers/test-app";

describe("POST /waitlist (público, usado pelo site)", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  it("entra na lista: 201 na primeira vez, 200 + alreadyJoined depois (e-mail normalizado)", async () => {
    const first = await t.http.post("/waitlist").send({ email: "Quero@Foco.App", source: "landing" }).expect(201);
    expect(first.body).toEqual({ ok: true, alreadyJoined: false });

    const again = await t.http.post("/waitlist").send({ email: "quero@foco.app" }).expect(200);
    expect(again.body).toEqual({ ok: true, alreadyJoined: true });

    const rows = await t.prisma.waitlistEntry.findMany({ where: { email: "quero@foco.app" } });
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("landing");
  });

  it("origem padrão é 'site'", async () => {
    await t.http.post("/waitlist").send({ email: "semorigem@foco.app" }).expect(201);
    const row = await t.prisma.waitlistEntry.findUnique({ where: { email: "semorigem@foco.app" } });
    expect(row?.source).toBe("site");
  });

  it("e-mail inválido → 400 com issues", async () => {
    const res = await t.http.post("/waitlist").send({ email: "nao-e-email" }).expect(400);
    expect(res.body).toEqual({ error: "E-mail inválido", issues: [{ path: "email", message: "E-mail inválido" }] });
  });

  it("não exige token", async () => {
    await t.http.post("/waitlist").set("Authorization", "Bearer lixo").send({ email: "x@y.com" }).expect(201);
  });
});
