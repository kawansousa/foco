/**
 * Catálogo de troféus do Foco. As regras de desbloqueio vivem na API
 * (`apps/api/src/services/trophies.ts`); aqui ficam nome, descrição e visual.
 */

export type TrophyTier = "bronze" | "prata" | "ouro";

export type TrophyCode =
  | "primeiro_passo"
  | "sete_dias"
  | "superacao"
  | "mes_inteiro"
  | "meta_batida"
  | "sem_folga"
  | "cem_dias"
  | "madrugador";

export type TrophyDef = {
  code: TrophyCode;
  name: string;
  desc: string;
  tier: TrophyTier;
  /** nome do ícone lucide (web e mobile usam a mesma família) */
  icon: "Sunrise" | "Flame" | "Mountain" | "Calendar" | "Medal" | "Zap" | "Crown" | "Lock" | "Coffee";
  /** troféu secreto: aparece como "???" até ser conquistado */
  secret?: boolean;
  /** um por meta (ex.: "Meta batida") em vez de um por usuário */
  perGoal?: boolean;
};

export const TROPHIES: TrophyDef[] = [
  { code: "primeiro_passo", name: "Primeiro passo", desc: "Concluiu o 1º passo de uma meta", tier: "bronze", icon: "Sunrise" },
  { code: "sete_dias", name: "7 dias seguidos", desc: "Uma semana sem falhar", tier: "bronze", icon: "Flame" },
  { code: "superacao", name: "Superação", desc: "Concluiu um dia marcado como 5/5", tier: "prata", icon: "Mountain" },
  { code: "mes_inteiro", name: "Mês inteiro", desc: "30 dias de constância", tier: "prata", icon: "Calendar" },
  { code: "meta_batida", name: "Meta batida", desc: "Finalizou uma meta no prazo", tier: "ouro", icon: "Medal", perGoal: true },
  { code: "sem_folga", name: "Sem folga", desc: "Todos os passos de um dia", tier: "ouro", icon: "Zap" },
  { code: "cem_dias", name: "100 dias", desc: "Cem dias de sequência", tier: "ouro", icon: "Crown" },
  { code: "madrugador", name: "Madrugador", desc: "Concluiu um passo antes das 7h", tier: "bronze", icon: "Coffee", secret: true },
];

export const TROPHY_BY_CODE: Record<TrophyCode, TrophyDef> = Object.fromEntries(
  TROPHIES.map((t) => [t.code, t]),
) as Record<TrophyCode, TrophyDef>;

export const TIER_LABEL: Record<TrophyTier, string> = { bronze: "Bronze", prata: "Prata", ouro: "Ouro" };
