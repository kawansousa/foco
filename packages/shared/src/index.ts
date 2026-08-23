export * from "./dates";
export * from "./schemas";
export * from "./types";
export * from "./trophies";
export * from "./fo";
export * from "./progress";
export * from "./client";

export const DEFAULT_SETTINGS = {
  reminderTime: "08:00",
  middayTime: "13:00",
  streakAlertTime: "20:00",
  tone: "leve",
  celebrateTrophies: true,
  quietOnRestDays: true,
  restDays: [] as number[],
} as const;
