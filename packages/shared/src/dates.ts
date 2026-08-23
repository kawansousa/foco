/**
 * Datas no Foco são sempre strings `YYYY-MM-DD` no fuso LOCAL do usuário.
 * O cliente (app/site) decide qual é "hoje" e manda para a API; a API nunca
 * converte para UTC, só compara strings.
 */

export type ISODate = string; // YYYY-MM-DD

const pad = (n: number) => String(n).padStart(2, "0");

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(now: Date = new Date()): ISODate {
  return toISODate(now);
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return toISODate(d) === s;
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISODate(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Diferença em dias (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  const ms = parseISODate(b).getTime() - parseISODate(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** 0 = domingo … 6 = sábado */
export function weekdayOf(s: ISODate): number {
  return parseISODate(s).getDay();
}

/** Lista de datas entre `from` e `to` (inclusive). */
export function eachDay(from: ISODate, to: ISODate): ISODate[] {
  const out: ISODate[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export const WEEKDAY_SHORT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;
export const WEEKDAY_LONG = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"] as const;
export const MONTH_SHORT = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"] as const;

/** "sáb, 23 ago" */
export function formatDayLabel(s: ISODate): string {
  const d = parseISODate(s);
  return `${WEEKDAY_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** "23 ago" */
export function formatShort(s: ISODate): string {
  const d = parseISODate(s);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

/** Texto de prazo relativo: "42 dias", "hoje", "atrasada 3 dias", "contínua". */
export function formatDue(dueDate: ISODate | null, today: ISODate): string {
  if (!dueDate) return "contínua";
  const n = diffDays(today, dueDate);
  if (n === 0) return "hoje";
  if (n === 1) return "amanhã";
  if (n > 1) return `${n} dias`;
  return `atrasada ${-n} ${-n === 1 ? "dia" : "dias"}`;
}

export function isValidTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}
