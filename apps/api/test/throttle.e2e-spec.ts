import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bearer, createTestApp, type TestApp } from "./helpers/test-app";

describe("rate limiting por IP", () => {
  let t: TestApp;
  beforeAll(async () => {
    // Limites baixos só neste arquivo (nos demais o setup-env deixa alto)
    t = await createTestApp({ env: { RATE_LIMIT_AUTH_PER_MIN: "3", RATE_LIMIT_PER_MIN: "8" } });
  });
  afterAll(() => t.close());

  it("login e cadastro COMPARTILHAM o limite estrito; 429 em português com Retry-After", async () => {
    await t.http.post("/auth/login").send({ email: "a@x.com", password: "errada-123" }).expect(401);
    await t.http.post("/auth/login").send({ email: "a@x.com", password: "errada-123" }).expect(401);
    await t.http
      .post("/auth/register")
      .send({ name: "Pessoa", email: "p1@limite.dev", password: "senha-forte-123" })
      .expect(201);

    // 4ª chamada no MESMO balde (2 logins + 1 cadastro já contados)
    const res = await t.http.post("/auth/login").send({ email: "a@x.com", password: "errada-123" }).expect(429);
    expect(res.body).toEqual({ error: "Muitas tentativas. Aguarde um minuto e tente de novo." });
    expect(res.headers["retry-after"]).toBeDefined();
    await t.http
      .post("/auth/register")
      .send({ name: "Pessoa", email: "p2@limite.dev", password: "senha-forte-123" })
      .expect(429);
  });

  it("rotas comuns usam o limite folgado, por rota", async () => {
    for (let i = 0; i < 8; i++) await t.http.get("/health").expect(200);
    await t.http.get("/health").expect(429);
    // outra rota tem contador próprio e continua respondendo
    await t.http.get("/").expect(200);
  });

  it("o throttler conta ANTES da autenticação: flood não autenticado também leva 429", async () => {
    // fixa a ordem dos guards globais (throttle → auth); se inverter, isto falha
    for (let i = 0; i < 8; i++) {
      await t.http.get("/goals").set(bearer("token-invalido")).expect(401);
    }
    await t.http.get("/goals").set(bearer("token-invalido")).expect(429);
  });
});
