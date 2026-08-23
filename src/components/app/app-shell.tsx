"use client";

import { useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  CalendarCheck,
  Target,
  Trophy,
  Sprout,
  Flame,
  Sunrise,
  Mountain,
  Medal,
  Calendar,
  Lock,
  Zap,
  Crown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { FoAvatar } from "@/components/avatar/fo-avatar";
import { TodayScreen } from "./today-screen";
import { cn } from "@/lib/utils";

/* ---------- Metas ---------- */

const goals = [
  { name: "Maratona 10k", due: "42 dias", progress: 62, step: "Correr 3 km" },
  { name: "12 livros no ano", due: "dez", progress: 58, step: "Ler 20 páginas" },
  { name: "Fluência B2", due: "90 dias", progress: 31, step: "Estudar inglês 25 min" },
  { name: "Hábito diário", due: "contínua", progress: 100, step: "Beber 2L de água" },
];

function GoalsScreen() {
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5 pt-3">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">4 ativas</p>
        <p className="text-lg font-semibold tracking-tight">Suas metas</p>
      </div>
      <ul className="space-y-2">
        {goals.map((g) => (
          <li key={g.name} className="rounded-2xl border bg-card p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{g.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Prazo · {g.due} · próximo: {g.step}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${g.progress}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 18 }}
                />
              </div>
              <span className="w-9 text-right text-[11px] font-medium text-muted-foreground">{g.progress}%</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Troféus ---------- */

const trophies: { icon: LucideIcon; name: string; earned: string | null; tier: "bronze" | "prata" | "ouro" }[] = [
  { icon: Sunrise, name: "Primeiro passo", earned: "12 jul", tier: "bronze" },
  { icon: Flame, name: "7 dias seguidos", earned: "19 jul", tier: "bronze" },
  { icon: Mountain, name: "Superação", earned: "02 ago", tier: "prata" },
  { icon: Calendar, name: "Mês inteiro", earned: "11 ago", tier: "prata" },
  { icon: Medal, name: "Meta batida", earned: "20 ago", tier: "ouro" },
  { icon: Zap, name: "Sem folga", earned: "hoje", tier: "ouro" },
  { icon: Crown, name: "100 dias", earned: null, tier: "ouro" },
  { icon: Lock, name: "???", earned: null, tier: "bronze" },
];

const tierClass = {
  bronze: "from-chart-1 to-chart-3",
  prata: "from-chart-2 to-chart-4",
  ouro: "from-chart-3 to-chart-5",
};

function TrophiesScreen() {
  const earned = trophies.filter((t) => t.earned).length;
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5 pt-3">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {earned} de {trophies.length}
        </p>
        <p className="text-lg font-semibold tracking-tight">Troféus</p>
      </div>
      <ul className="grid grid-cols-2 gap-2">
        {trophies.map((t) => {
          const locked = !t.earned;
          return (
            <li
              key={t.name}
              className={cn(
                "flex flex-col items-center rounded-2xl border bg-card p-3 text-center",
                locked && "opacity-60",
              )}
            >
              <div
                className={cn(
                  "flex size-11 items-center justify-center rounded-full bg-gradient-to-br text-white",
                  locked ? "from-muted to-muted-foreground/30 text-muted-foreground" : tierClass[t.tier],
                )}
              >
                <t.icon className="size-5" />
              </div>
              <p className="mt-2 text-xs font-semibold">{t.name}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.earned ?? "Bloqueado"}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ---------- Fô ---------- */

function FoScreen() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 pb-5 pt-3 text-center">
      <FoAvatar mood="wave" size={112} />
      <div>
        <p className="text-lg font-semibold tracking-tight">Oi, eu sou o Fô 🌱</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Eu lembro você dos passos do dia, comemoro as conquistas e ajusto o ritmo quando o dia foi puxado.
        </p>
      </div>
      <div className="w-full space-y-2 text-left text-sm">
        {[
          ["Lembrete diário", "08:00"],
          ["Tom das mensagens", "Amigável"],
          ["Comemorar troféus", "Sim"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-xl border bg-card px-3 py-2.5">
            <span>{k}</span>
            <span className="text-muted-foreground">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Shell ---------- */

type TabId = "hoje" | "metas" | "trofeus" | "fo";

const tabs: { id: TabId; label: string; icon: LucideIcon; screen: ComponentType }[] = [
  { id: "hoje", label: "Hoje", icon: CalendarCheck, screen: TodayScreen },
  { id: "metas", label: "Metas", icon: Target, screen: GoalsScreen },
  { id: "trofeus", label: "Troféus", icon: Trophy, screen: TrophiesScreen },
  { id: "fo", label: "Fô", icon: Sprout, screen: FoScreen },
];

/**
 * Shell do app Foco: telas + barra de abas inferior.
 * É o mesmo conteúdo no celular (tela cheia) e na web (dentro do iPhone).
 */
export function AppShell({ className }: { className?: string }) {
  const [tab, setTab] = useState<TabId>("hoje");
  const Screen = tabs.find((t) => t.id === tab)!.screen;

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col bg-background text-foreground", className)}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>

      <nav aria-label="Abas do app" className="grid shrink-0 grid-cols-4 border-t bg-card/90 px-2 pt-1.5 pb-1 backdrop-blur">
        {tabs.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              {t.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
