import { describe, expect, it } from "vitest";
import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const service = new PasswordService();

  it("gera hashes diferentes para a mesma senha (salt aleatório) e verifica ambos", async () => {
    const a = await service.hash("segredo-123");
    const b = await service.hash("segredo-123");
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{32}:[0-9a-f]{128}$/);
    await expect(service.verify("segredo-123", a)).resolves.toBe(true);
    await expect(service.verify("segredo-123", b)).resolves.toBe(true);
  });

  it("rejeita senha errada", async () => {
    const hash = await service.hash("segredo-123");
    await expect(service.verify("segredo-124", hash)).resolves.toBe(false);
    await expect(service.verify("", hash)).resolves.toBe(false);
  });

  it("rejeita hash malformado sem lançar", async () => {
    await expect(service.verify("x", "")).resolves.toBe(false);
    await expect(service.verify("x", "sem-separador")).resolves.toBe(false);
    await expect(service.verify("x", "abc:zz")).resolves.toBe(false);
  });
});
