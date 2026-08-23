import { BadRequestException, type ArgumentMetadata } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { Clock } from "../clock/clock";
import { DateQueryPipe, OptionalDateQueryPipe } from "./iso-date.pipe";

const meta: ArgumentMetadata = { type: "query", data: "date" };

class StubClock extends Clock {
  override todayISO() {
    return "2026-03-10";
  }
}

describe("DateQueryPipe", () => {
  const pipe = new DateQueryPipe(new StubClock());

  it("sem valor, usa o hoje do relógio", () => {
    expect(pipe.transform(undefined, meta)).toBe("2026-03-10");
    expect(pipe.transform("", meta)).toBe("2026-03-10");
  });

  it("aceita YYYY-MM-DD válido", () => {
    expect(pipe.transform("2026-02-28", meta)).toBe("2026-02-28");
  });

  it.each(["2026-2-1", "10/03/2026", "2026-02-30", "hoje", "2026-13-01"])("rejeita %s com 400", (v) => {
    expect(() => pipe.transform(v, meta)).toThrow(BadRequestException);
  });

  it("a mensagem cita o nome do parâmetro", () => {
    let caught: unknown;
    try {
      pipe.transform("x", { type: "query", data: "from" });
    } catch (err) {
      caught = err;
    }
    expect((caught as BadRequestException).getResponse()).toEqual({ error: "Parâmetro from inválido (YYYY-MM-DD)." });
  });
});

describe("OptionalDateQueryPipe", () => {
  const pipe = new OptionalDateQueryPipe();

  it("sem valor devolve undefined (sem default)", () => {
    expect(pipe.transform(undefined, meta)).toBeUndefined();
  });

  it("valida quando presente", () => {
    expect(pipe.transform("2026-01-31", meta)).toBe("2026-01-31");
    expect(() => pipe.transform("31-01-2026", meta)).toThrow(BadRequestException);
  });
});
