import { describe, expect, it } from "vitest";
import { parseRestDays, serializeRestDays, toGoal, toSettings } from "./mappers";

describe("restDays (JSON no banco ↔ number[] na API)", () => {
  it("parse aceita só inteiros de 0 a 6", () => {
    expect(parseRestDays("[0,6]")).toEqual([0, 6]);
    expect(parseRestDays("[7,-1,2.5,\"x\",3]")).toEqual([3]);
  });

  it("parse tolera JSON quebrado ou não-array", () => {
    expect(parseRestDays("nope")).toEqual([]);
    expect(parseRestDays("{}")).toEqual([]);
  });

  it("serialize remove repetidos e ordena", () => {
    expect(serializeRestDays([6, 0, 6, 3])).toBe("[0,3,6]");
    expect(serializeRestDays([])).toBe("[]");
  });
});

describe("mappers de linha → API", () => {
  it("toSettings converte restDays e preserva o resto", () => {
    const s = toSettings({
      userId: "u",
      reminderTime: "07:30",
      middayTime: "13:00",
      streakAlertTime: "20:00",
      tone: "firme",
      celebrateTrophies: false,
      quietOnRestDays: true,
      restDays: "[0]",
    });
    expect(s).toEqual({
      reminderTime: "07:30",
      middayTime: "13:00",
      streakAlertTime: "20:00",
      tone: "firme",
      celebrateTrophies: false,
      quietOnRestDays: true,
      restDays: [0],
    });
  });

  it("toGoal serializa datas-instante como ISO e mantém datas de calendário como string", () => {
    const g = toGoal({
      id: "g",
      userId: "u",
      title: "T",
      stepTitle: "S",
      description: null,
      startDate: "2026-01-01",
      dueDate: null,
      reminderTime: null,
      status: "done",
      completedAt: new Date("2026-03-10T15:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(g.completedAt).toBe("2026-03-10T15:00:00.000Z");
    expect(g.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(g.startDate).toBe("2026-01-01");
    expect(g).not.toHaveProperty("userId");
  });
});
