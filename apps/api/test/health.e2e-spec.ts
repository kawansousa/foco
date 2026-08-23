import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./helpers/test-app";

describe("infra HTTP", () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  it("GET / e /health são públicos e /health usa o relógio da aplicação", async () => {
    await t.http.get("/").expect(200, { name: "Foco API", docs: "/health" });
    const res = await t.http.get("/health").expect(200);
    expect(res.body).toEqual({ ok: true, time: "2026-03-10T12:00:00.000Z" });
  });

  it("rota inexistente responde 404 em JSON no formato da API", async () => {
    await t.http.get("/nao-existe").expect(404, { error: "Rota não encontrada." });
  });

  it("JSON inválido no corpo responde 400 amigável", async () => {
    const res = await t.http.post("/waitlist").set("Content-Type", "application/json").send("{oops").expect(400);
    expect(res.body).toEqual({ error: "Corpo da requisição precisa ser JSON." });
  });

  it("CORS liberado para qualquer origem quando CORS_ORIGINS está vazio", async () => {
    const res = await t.http.options("/health").set("Origin", "http://qualquer.com").set("Access-Control-Request-Method", "GET");
    expect(res.headers["access-control-allow-origin"]).toBe("*");
  });
});
