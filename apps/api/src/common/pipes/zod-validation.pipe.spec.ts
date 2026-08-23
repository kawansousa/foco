import { BadRequestException } from "@nestjs/common";
import { createGoalSchema, registerSchema } from "@foco/shared";
import { describe, expect, it } from "vitest";
import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  it("devolve os dados já normalizados pelo schema (trim, lowercase)", () => {
    const pipe = new ZodValidationPipe(registerSchema);
    expect(pipe.transform({ name: "  Ana  ", email: "ANA@X.COM", password: "12345678" })).toEqual({
      name: "Ana",
      email: "ana@x.com",
      password: "12345678",
    });
  });

  it("lança 400 no formato { error, issues } com o caminho de cada problema", () => {
    const pipe = new ZodValidationPipe(createGoalSchema);
    let caught: unknown;
    try {
      pipe.transform({ title: "A", stepTitle: "Ler", startDate: "2026-03-10", dueDate: "2026-01-01" });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(BadRequestException);
    const body = (caught as BadRequestException).getResponse() as {
      error: string;
      issues: { path: string; message: string }[];
    };
    expect(body.issues.length).toBeGreaterThan(0);
    expect(body.error).toBe(body.issues[0].message);
    expect(body.issues.map((i) => i.path)).toEqual(expect.arrayContaining(["title", "dueDate"]));
  });

  it("corpo ausente vira 400, não 500", () => {
    const pipe = new ZodValidationPipe(registerSchema);
    expect(() => pipe.transform(undefined)).toThrow(BadRequestException);
  });
});
