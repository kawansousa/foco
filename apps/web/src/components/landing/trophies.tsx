"use client";

import { motion } from "motion/react";
import { Flame, Sunrise, Mountain, Medal, Calendar, Lock, Zap, Crown } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

const trophies = [
  { icon: Sunrise, name: "Primeiro passo", desc: "Concluiu o 1º passo de uma meta", earned: "12 jul", tier: "bronze" },
  { icon: Flame, name: "7 dias seguidos", desc: "Uma semana sem falhar", earned: "19 jul", tier: "bronze" },
  { icon: Mountain, name: "Superação", desc: "Concluiu um dia marcado como 5/5", earned: "02 ago", tier: "prata" },
  { icon: Calendar, name: "Mês inteiro", desc: "30 dias de constância", earned: "11 ago", tier: "prata" },
  { icon: Medal, name: "Meta batida", desc: "Finalizou uma meta no prazo", earned: "20 ago", tier: "ouro" },
  { icon: Zap, name: "Sem folga", desc: "Todos os passos de um dia", earned: "hoje", tier: "ouro" },
  { icon: Crown, name: "100 dias", desc: "Cem dias de sequência", earned: null, tier: "ouro" },
  { icon: Lock, name: "???", desc: "Conquista secreta", earned: null, tier: "bronze" },
];

const tierClass: Record<string, string> = {
  bronze: "from-chart-1 to-chart-3",
  prata: "from-chart-2 to-chart-4",
  ouro: "from-chart-3 to-chart-5",
};

export function Trophies() {
  return (
    <section id="trofeus" className="scroll-mt-24 border-y bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Troféus"
          title="Cada conquista com data, contexto e o seu comentário."
          description="Não é só um ícone. É o registro de um dia em que você fez o que disse que ia fazer."
        />

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {trophies.map((t, i) => {
            const locked = !t.earned;
            return (
              <Reveal key={t.name} delay={(i % 4) * 0.06}>
                <motion.div
                  whileHover={locked ? undefined : { y: -4 }}
                  className={cn(
                    "relative flex h-full flex-col items-center rounded-2xl border bg-card p-5 text-center",
                    locked && "opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg shadow-primary/20",
                      locked ? "from-muted to-muted-foreground/30 text-muted-foreground shadow-none" : tierClass[t.tier],
                    )}
                  >
                    <t.icon className="size-7" />
                  </div>
                  <p className="mt-4 font-semibold tracking-tight">{t.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
                  <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {t.earned ? `Conquistado · ${t.earned}` : "Bloqueado"}
                  </p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
