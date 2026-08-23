"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Flame, Trophy, Bell } from "lucide-react";
import { FoAvatar } from "@/components/avatar/fo-avatar";
import { cn } from "@/lib/utils";

export type Task = { id: number; title: string; goal: string; done: boolean };

export const initialTasks: Task[] = [
  { id: 1, title: "Correr 3 km", goal: "Maratona 10k · 42 dias", done: true },
  { id: 2, title: "Ler 20 páginas", goal: "12 livros no ano", done: true },
  { id: 3, title: "Estudar inglês 25 min", goal: "Fluência B2 · 90 dias", done: false },
  { id: 4, title: "Beber 2L de água", goal: "Hábito diário", done: false },
];

function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="size-16">
      <circle cx="32" cy="32" r={r} className="stroke-muted" strokeWidth="6" fill="none" />
      <motion.circle
        cx="32"
        cy="32"
        r={r}
        className="stroke-primary"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (c * value) / 100 }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="36" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
        {Math.round(value)}%
      </text>
    </svg>
  );
}

type Props = {
  /** Mostra o toast do Fô automaticamente e a dica "toque pra testar" (uso na landing). */
  demo?: boolean;
  className?: string;
};

/**
 * Tela "Hoje" do Foco: lista de passos do dia, anel de progresso e troféu ao completar.
 * É a mesma tela usada no app mobile e na versão web.
 */
export function TodayScreen({ demo = false, className }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showToast, setShowToast] = useState(false);
  const [trophy, setTrophy] = useState(false);

  const done = tasks.filter((t) => t.done).length;
  const pct = useMemo(() => (done / tasks.length) * 100, [done, tasks.length]);

  useEffect(() => {
    if (!demo) return;
    const t = setTimeout(() => setShowToast(true), 1800);
    const t2 = setTimeout(() => setShowToast(false), 6500);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [demo]);

  const trophyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (trophyTimer.current) clearTimeout(trophyTimer.current);
    },
    [],
  );

  const toggle = (id: number) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTasks(next);
    if (next.every((t) => t.done)) {
      setTrophy(true);
      if (trophyTimer.current) clearTimeout(trophyTimer.current);
      trophyTimer.current = setTimeout(() => setTrophy(false), 3200);
    }
  };

  return (
    <div className={cn("relative flex min-h-0 flex-1 flex-col", className)}>
      {/* toast do Fô */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -70, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -70, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="absolute inset-x-3 top-1 z-30 flex items-center gap-3 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur"
          >
            <FoAvatar mood="wave" size={40} />
            <div className="min-w-0 text-xs">
              <p className="font-semibold">Fô · agora</p>
              <p className="text-muted-foreground">Faltam 2 passos pra fechar o dia. Bora? 🌱</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* trophy overlay */}
      <AnimatePresence>
        {trophy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.4, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 14 }}
              className="flex size-20 items-center justify-center rounded-full bg-primary/15 text-primary"
            >
              <Trophy className="size-10" />
            </motion.div>
            <p className="text-sm font-semibold">Dia completo! 🏆</p>
            <p className="text-xs text-muted-foreground">Troféu “Sem folga” desbloqueado</p>
            <FoAvatar mood="celebrate" size={56} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Hoje · sáb, 23 ago</p>
            <p className="text-lg font-semibold tracking-tight">Seus passos</p>
          </div>
          <div className="relative">
            <Bell className="size-5 text-muted-foreground" />
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border bg-card p-3">
          <ProgressRing value={pct} />
          <div className="text-sm">
            <p className="font-medium">
              {done}/{tasks.length} concluídos
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Flame className="size-3.5 text-orange-500" /> 12 dias seguidos
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => toggle(t.id)}
                aria-pressed={t.done}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent",
                  t.done && "bg-primary/5 border-primary/30",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    t.done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {t.done && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm font-medium", t.done && "text-muted-foreground line-through")}>
                    {t.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">{t.goal}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {demo && <p className="text-center text-[11px] text-muted-foreground">Toque nos itens pra testar ✨</p>}
      </div>
    </div>
  );
}
