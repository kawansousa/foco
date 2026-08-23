import type { Tone } from "./schemas";
import type { FoMessage } from "./types";

export type FoMood = "happy" | "wave" | "celebrate" | "sleepy" | "thinking";

export type FoContext = {
  name: string;
  tone: Tone;
  /** passos do dia */
  total: number;
  done: number;
  streak: number;
  /** nome do primeiro passo pendente (ou concluído, se não houver pendente) */
  nextStep?: string | null;
  time?: string | null;
};

const firstName = (name: string) => name.trim().split(/\s+/)[0] || "você";

type Line = (c: FoContext) => string;
type Variants = Record<Tone, Line>;

const pending = (c: FoContext) => c.total - c.done;

const lines: Record<FoMessage["kind"], { mood: FoMood; title: Variants; text: Variants }> = {
  morning: {
    mood: "wave",
    title: {
      leve: () => "Bom dia! ☀️",
      neutro: () => "Bom dia",
      firme: () => "Hora de começar",
    },
    text: {
      leve: (c) =>
        c.total === 0
          ? `Oi, ${firstName(c.name)}! Nenhum passo pra hoje. Que tal criar uma meta?`
          : `Hoje tem ${c.total} ${c.total === 1 ? "passo" : "passos"}. O primeiro: ${c.nextStep ?? "o que vier"}. Sem pressa 🌱`,
      neutro: (c) =>
        c.total === 0
          ? `Sem passos hoje. Crie uma meta pra começar.`
          : `${c.total} ${c.total === 1 ? "passo" : "passos"} hoje. Comece por: ${c.nextStep ?? "qualquer um"}.`,
      firme: (c) =>
        c.total === 0
          ? `Nenhuma meta ativa. Defina uma e bora.`
          : `${c.total} ${c.total === 1 ? "passo" : "passos"}. Primeiro: ${c.nextStep ?? "o mais difícil"}. Sem adiar.`,
    },
  },
  midday: {
    mood: "thinking",
    title: {
      leve: () => "Metade do dia",
      neutro: () => "Metade do dia",
      firme: () => "Metade do dia",
    },
    text: {
      leve: (c) =>
        pending(c) > 0
          ? `${c.done} de ${c.total} feitos. ${c.nextStep ? `"${c.nextStep}" cabe depois do almoço?` : "Bora com o resto?"}`
          : `Tudo feito antes do meio-dia. Que ritmo! 😌`,
      neutro: (c) =>
        pending(c) > 0 ? `${c.done} de ${c.total} concluídos. ${pending(c)} ${pending(c) === 1 ? "resta" : "restam"}.` : `Dia concluído.`,
      firme: (c) =>
        pending(c) > 0 ? `${c.done}/${c.total}. Ainda faltam ${pending(c)}. Não deixa pra noite.` : `Fechou cedo. Assim que se faz.`,
    },
  },
  streak_risk: {
    mood: "wave",
    title: {
      leve: () => "Sequência em risco 🔥",
      neutro: () => "Sequência em risco",
      firme: () => "Não perde o dia",
    },
    text: {
      leve: (c) =>
        `${c.streak} ${c.streak === 1 ? "dia" : "dias"} seguidos. Falta só ${pending(c)} ${pending(c) === 1 ? "passo" : "passos"} pra manter. Eu acredito.`,
      neutro: (c) => `${c.streak} dias de sequência. ${pending(c)} ${pending(c) === 1 ? "passo pendente" : "passos pendentes"}.`,
      firme: (c) => `${c.streak} dias construídos. ${pending(c)} ${pending(c) === 1 ? "passo" : "passos"} entre você e o dia perdido. Vai.`,
    },
  },
  day_complete: {
    mood: "celebrate",
    title: {
      leve: () => "Dia completo! 🏆",
      neutro: () => "Dia completo",
      firme: () => "Dia fechado",
    },
    text: {
      leve: (c) => `Todos os ${c.total} passos feitos. ${c.streak} ${c.streak === 1 ? "dia" : "dias"} seguidos. Agora conta como foi?`,
      neutro: (c) => `${c.total}/${c.total}. Sequência: ${c.streak}. Registre como foi.`,
      firme: (c) => `Cumprido. ${c.streak} dias. Amanhã de novo.`,
    },
  },
  night: {
    mood: "sleepy",
    title: {
      leve: () => "Descansa",
      neutro: () => "Boa noite",
      firme: () => "Boa noite",
    },
    text: {
      leve: () => `Nada pendente. Amanhã a gente continua. Boa noite 🌙`,
      neutro: () => `Sem pendências. Até amanhã.`,
      firme: () => `Feito. Descansa que amanhã tem mais.`,
    },
  },
  rest_day: {
    mood: "sleepy",
    title: {
      leve: () => "Dia de descanso",
      neutro: () => "Dia de descanso",
      firme: () => "Dia de descanso",
    },
    text: {
      leve: () => `Hoje é folga combinada. Sua sequência está guardada. Aproveita 🌿`,
      neutro: () => `Folga programada. A sequência não conta hoje.`,
      firme: () => `Descanso faz parte do plano. Volta amanhã.`,
    },
  },
  checkin: {
    mood: "happy",
    title: { leve: () => "Fô", neutro: () => "Fô", firme: () => "Fô" },
    text: { leve: () => "", neutro: () => "", firme: () => "" },
  },
};

export function foMessage(kind: Exclude<FoMessage["kind"], "checkin">, c: FoContext): FoMessage {
  const l = lines[kind];
  return { kind, mood: l.mood, time: c.time ?? null, title: l.title[c.tone](c), text: l.text[c.tone](c) };
}

/** Resposta do Fô ao registro de dificuldade (1–5). */
export function foCheckinReply(difficulty: number | null, tone: Tone, done: boolean): FoMessage {
  const base = { kind: "checkin" as const, time: null, title: "Fô" };
  if (!done) {
    return {
      ...base,
      mood: "thinking",
      text:
        tone === "firme"
          ? "Desmarcado. Sem problema, mas não deixa virar hábito."
          : tone === "neutro"
            ? "Desmarcado. Quando fizer, marca de novo."
            : "Tudo bem, desmarcado. Quando der, eu tô aqui.",
    };
  }
  const replies: Record<number, Record<Tone, { mood: FoMood; text: string }>> = {
    1: {
      leve: { mood: "happy", text: "Dia leve é dia ganho. Guarda essa energia pro próximo passo!" },
      neutro: { mood: "happy", text: "Tranquilo hoje. Registrado." },
      firme: { mood: "happy", text: "Fácil. Então dá pra subir o nível amanhã." },
    },
    2: {
      leve: { mood: "happy", text: "Boa! Constância se constrói assim, sem drama." },
      neutro: { mood: "happy", text: "Leve e feito. Segue o ritmo." },
      firme: { mood: "happy", text: "Feito sem sofrer. Mantém." },
    },
    3: {
      leve: { mood: "thinking", text: "Normal ter dia médio. O importante: você fez." },
      neutro: { mood: "thinking", text: "Dia médio, passo concluído." },
      firme: { mood: "thinking", text: "Médio, mas feito. É isso que conta." },
    },
    4: {
      leve: { mood: "wave", text: "Foi puxado e você não desistiu. Isso vale troféu, viu?" },
      neutro: { mood: "wave", text: "Dia puxado, e ainda assim concluído." },
      firme: { mood: "wave", text: "Puxado. Você aguentou. Respeito." },
    },
    5: {
      leve: { mood: "celebrate", text: "Dia muito difícil e ainda assim concluído. Respeito. 🏅" },
      neutro: { mood: "celebrate", text: "5/5 e concluído. Isso é superação." },
      firme: { mood: "celebrate", text: "Muito difícil. Feito mesmo assim. É disso que sequência é feita." },
    },
  };
  if (!difficulty || !replies[difficulty]) {
    return {
      ...base,
      mood: "happy",
      text: tone === "firme" ? "Marcado. Agora registra o quanto foi difícil." : "Boa! Quer contar como foi?",
    };
  }
  return { ...base, ...replies[difficulty][tone] };
}

export const DIFFICULTY_LEVELS = [
  { value: 1, label: "Tranquilo", emoji: "😌" },
  { value: 2, label: "Leve", emoji: "🙂" },
  { value: 3, label: "Médio", emoji: "😐" },
  { value: 4, label: "Puxado", emoji: "😮‍💨" },
  { value: 5, label: "Muito difícil", emoji: "🥵" },
] as const;

export const TONE_LABEL: Record<Tone, string> = { leve: "Leve", neutro: "Neutro", firme: "Firme" };
