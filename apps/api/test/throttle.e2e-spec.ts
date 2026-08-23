import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestApp } from "./helpers/test-app";

/**
 * Limites baixos só neste arquivo. As variáveis precisam existir ANTES de
 * importar o AppModule (o ConfigModule lê o ambiente no import), por isso o
 * helper é importado dinamicamente.
 */
process.env.RATE_LIMIT_AUTH_PER_MIN = "3";
process.env.RATE_LIMIT_PER_MIN = "8";

describe("rate limiting por IP", () => {
  let t: TestApp;
  beforeAll(async () => {
    const helpers = await import("./helpers/test-app");
    t = await helpers.createTestApp();
  });
  afterAll(() => t.close());

  it("login: após o limite responde 429 com mensagem em português e Retry-After", async () => {
    const body = { email: "alguem@exemplo.com", password: "qualquer-coisa" };
    for (let i = 0; i < 3; i++) await t.http.post("/auth/login").send(body).expect(401);
    const res = await t.http.post("/auth/login").send(body).expect(429);
    expect(res.body).toEqual({ error: "Muitas tentativas. Aguarde um minuto e tente de novo." });
    expect(res.headers["retry-after"]).toBeDefined();
  });

  it("cadastro tem o mesmo limite estrito (contador próprio por rota)", async () => {
    for (let i = 0; i < 3; i++) {
      await t.http
        .post("/auth/register")
        .send({ name: "Pessoa", email: `p${i}@limite.dev`, password: "senha-forte-123" })
        .expect(201);
    }
    await t.http
      .post("/auth/register")
      .send({ name: "Pessoa", email: "p9@limite.dev", password: "senha-forte-123" })
      .expect(429);
  });

  it("rotas comuns usam o limite folgado", async () => {
    for (let i = 0; i < 8; i++) await t.http.get("/health").expect(200);
    await t.http.get("/health").expect(429);
  });
});
