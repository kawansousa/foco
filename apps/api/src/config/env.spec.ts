import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { API_ROOT, resolveSqlitePath } from "./database-url";
import { validateEnv } from "./env";

describe("validateEnv", () => {
  it("aplica defaults de desenvolvimento", () => {
    const env = validateEnv({});
    expect(env).toMatchObject({ nodeEnv: "development", isProd: false, port: 4000, corsOrigins: [] });
    expect(env.databasePath).toBe(resolve(API_ROOT, "data/foco.db"));
    expect(env.jwtSecret).toBeTruthy();
  });

  it("lê e converte variáveis", () => {
    const env = validateEnv({
      PORT: "5001",
      CORS_ORIGINS: "http://a.com, http://b.com ,",
      JWT_SECRET: "s3cr3t",
      DATABASE_URL: "file:/tmp/x.db",
    });
    expect(env.port).toBe(5001);
    expect(env.corsOrigins).toEqual(["http://a.com", "http://b.com"]);
    expect(env.jwtSecret).toBe("s3cr3t");
    expect(env.databasePath).toBe("/tmp/x.db");
  });

  it("em produção exige JWT_SECRET próprio (falha fechado)", () => {
    expect(() => validateEnv({ NODE_ENV: "production" })).toThrow(/JWT_SECRET/);
    expect(() => validateEnv({ NODE_ENV: "production", JWT_SECRET: "forte" })).not.toThrow();
  });

  it("rejeita porta inválida com mensagem legível", () => {
    expect(() => validateEnv({ PORT: "abc" })).toThrow(/PORT/);
  });
});

describe("resolveSqlitePath", () => {
  it("aceita os formatos file:, relativo e absoluto", () => {
    expect(resolveSqlitePath("file:./data/x.db", "/root")).toBe("/root/data/x.db");
    expect(resolveSqlitePath("./data/x.db", "/root")).toBe("/root/data/x.db");
    expect(resolveSqlitePath("/abs/x.db", "/root")).toBe("/abs/x.db");
    expect(resolveSqlitePath("file::memory:")).toBe(":memory:");
  });
});
