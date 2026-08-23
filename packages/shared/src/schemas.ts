import { z } from "zod";
import { isISODate, isValidTime } from "./dates";

// Mensagens padrão de validação em português (API, app e site).
z.config(z.locales.pt());

export const isoDateSchema = z
  .string()
  .refine(isISODate, { message: "Data inválida (use YYYY-MM-DD)" });

export const timeSchema = z.string().refine(isValidTime, { message: "Horário inválido (use HH:MM)" });

export const weekdaySchema = z.number().int().min(0).max(6);

export const toneSchema = z.enum(["leve", "neutro", "firme"]);
export type Tone = z.infer<typeof toneSchema>;

export const goalStatusSchema = z.enum(["active", "done", "archived"]);
export type GoalStatus = z.infer<typeof goalStatusSchema>;

/* ---------- auth ---------- */

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(60),
  email: z.email("E-mail inválido").toLowerCase(),
  password: z.string().min(8, "Senha com pelo menos 8 caracteres").max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("E-mail inválido").toLowerCase(),
  password: z.string().min(1, "Informe a senha"),
});
export type LoginInput = z.infer<typeof loginSchema>;

/* ---------- metas ---------- */

export const createGoalSchema = z
  .object({
    title: z.string().trim().min(2, "Dê um nome à meta").max(80),
    stepTitle: z.string().trim().min(2, "Descreva o passo diário").max(80),
    description: z.string().trim().max(500).optional().nullable(),
    startDate: isoDateSchema,
    /** null = meta contínua (hábito sem prazo) */
    dueDate: isoDateSchema.nullable(),
    /** horário do lembrete específico desta meta (HH:MM); null = usa o horário global */
    reminderTime: timeSchema.nullable().optional(),
  })
  .refine((g) => !g.dueDate || g.dueDate >= g.startDate, {
    message: "O prazo precisa ser depois do início",
    path: ["dueDate"],
  });
export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  title: z.string().trim().min(2).max(80).optional(),
  stepTitle: z.string().trim().min(2).max(80).optional(),
  description: z.string().trim().max(500).nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
  reminderTime: timeSchema.nullable().optional(),
  status: goalStatusSchema.optional(),
});
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

/* ---------- check-ins ---------- */

export const difficultySchema = z.number().int().min(1).max(5);

export const upsertCheckinSchema = z.object({
  goalId: z.string().min(1),
  date: isoDateSchema,
  done: z.boolean(),
  difficulty: difficultySchema.nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  /** hora local do cliente no momento do registro (HH:MM) — usada só para troféus secretos */
  localTime: timeSchema.optional(),
});
export type UpsertCheckinInput = z.infer<typeof upsertCheckinSchema>;

/* ---------- troféus ---------- */

export const updateTrophySchema = z.object({
  note: z.string().trim().max(300).nullable(),
});
export type UpdateTrophyInput = z.infer<typeof updateTrophySchema>;

/* ---------- configurações do Fô ---------- */

export const settingsSchema = z.object({
  reminderTime: timeSchema,
  middayTime: timeSchema,
  streakAlertTime: timeSchema,
  tone: toneSchema,
  celebrateTrophies: z.boolean(),
  quietOnRestDays: z.boolean(),
  restDays: z.array(weekdaySchema).max(7),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
export const updateSettingsSchema = settingsSchema.partial();
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

/* ---------- site ---------- */

export const waitlistSchema = z.object({
  email: z.email("E-mail inválido").toLowerCase(),
  source: z.string().trim().max(40).optional(),
});
export type WaitlistInput = z.infer<typeof waitlistSchema>;
