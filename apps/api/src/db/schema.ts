import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** data URL (jpeg base64) — foto de perfil */
  avatar: text("avatar"),
  createdAt: text("created_at").notNull().default(now),
});

export const settings = sqliteTable("settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  reminderTime: text("reminder_time").notNull().default("08:00"),
  middayTime: text("midday_time").notNull().default("13:00"),
  streakAlertTime: text("streak_alert_time").notNull().default("20:00"),
  tone: text("tone", { enum: ["leve", "neutro", "firme"] }).notNull().default("leve"),
  celebrateTrophies: integer("celebrate_trophies", { mode: "boolean" }).notNull().default(true),
  quietOnRestDays: integer("quiet_on_rest_days", { mode: "boolean" }).notNull().default(true),
  /** JSON: number[] (0 = domingo) */
  restDays: text("rest_days").notNull().default("[]"),
});

export const goals = sqliteTable(
  "goals",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    stepTitle: text("step_title").notNull(),
    description: text("description"),
    startDate: text("start_date").notNull(),
    dueDate: text("due_date"),
    reminderTime: text("reminder_time"),
    status: text("status", { enum: ["active", "done", "archived"] }).notNull().default("active"),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("goals_user_idx").on(t.userId, t.status)],
);

export const checkins = sqliteTable(
  "checkins",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    goalId: text("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    done: integer("done", { mode: "boolean" }).notNull().default(false),
    difficulty: integer("difficulty"),
    note: text("note"),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    uniqueIndex("checkins_goal_date_uq").on(t.goalId, t.date),
    index("checkins_user_date_idx").on(t.userId, t.date),
  ],
);

export const trophies = sqliteTable(
  "trophies",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    goalId: text("goal_id").references(() => goals.id, { onDelete: "set null" }),
    /** goalId para troféus por meta, "" para os globais — permite índice único simples */
    scopeKey: text("scope_key").notNull().default(""),
    date: text("date").notNull(),
    earnedAt: text("earned_at").notNull().default(now),
    note: text("note"),
  },
  (t) => [uniqueIndex("trophies_user_code_scope_uq").on(t.userId, t.code, t.scopeKey)],
);

export const waitlist = sqliteTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source"),
  createdAt: text("created_at").notNull().default(now),
});

export type UserRow = typeof users.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
export type GoalRow = typeof goals.$inferSelect;
export type CheckinRow = typeof checkins.$inferSelect;
export type TrophyRow = typeof trophies.$inferSelect;
