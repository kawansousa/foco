"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Target, ListChecks, Trophy, MessageSquareText, BellRing, LineChart } from "lucide-react";
import { FoAvatar, type FoMood } from "@/components/avatar/fo-avatar";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

type Feature = {
  icon: typeof Target;
  title: string;
  text: string;
  /** Fala do Fô explicando este passo da evolução. */
  fo: string;
  mood: FoMood;
};

const features: Feature[] = [
  {
    icon: Target,
    title: "Metas com prazo real",
    text: "Defina o objetivo, a data e o ritmo. O Foco calcula quantos passos cabem em cada dia.",
    fo: "Toda evolução começa com um destino. Me diz a meta e o prazo — eu fatio em passos do seu tamanho.",
    mood: "thinking",
  },
  {
    icon: ListChecks,
    title: "Check-in diário",
    text: "A lista do dia, sempre à mão. Concluiu? Um toque. Não deu? Tudo bem, amanhã continua.",
    fo: "Evolução é o que você repete. Cada dia, uma lista curta: um toque e o passo tá dado.",
    mood: "happy",
  },
  {
    icon: MessageSquareText,
    title: "Diário de dificuldade",
    text: "Comente como foi e marque de 1 a 5 o quanto foi difícil. Com o tempo, você enxerga padrões.",
    fo: "Dia difícil também conta. Registra como foi, e com o tempo a gente enxerga o seu padrão.",
    mood: "thinking",
  },
  {
    icon: Trophy,
    title: "Troféus que contam história",
    text: "Sequências, superações e marcos viram conquistas — cada uma com a data e o seu comentário.",
    fo: "Quando a constância aparece, vira conquista. Cada troféu guarda a história de como você chegou lá.",
    mood: "celebrate",
  },
  {
    icon: BellRing,
    title: "Lembretes com o Fô",
    text: "Notificações no horário certo, com a cara do Fô: firmes quando precisa, leves quando não.",
    fo: "Eu te lembro na hora certa — firme quando precisa, leve quando não. Ninguém evolui sozinho.",
    mood: "wave",
  },
  {
    icon: LineChart,
    title: "Progresso que você vê",
    text: "Gráficos de constância, dificuldade média e dias fortes. Dados que explicam o seu avanço.",
    fo: "E no fim você vê o caminho inteiro: constância, dias fortes e o quanto já andou.",
    mood: "happy",
  },
];

/** Linha da trilha: desce serpenteando pelo centro, desenhada ao rolar, com uma fagulha. */
function TrailLine() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 96 1200"
      preserveAspectRatio="none"
      className="pointer-events-none absolute -inset-y-8 left-6 h-[calc(100%+4rem)] w-24 -translate-x-1/2 sm:left-1/2"
    >
      <defs>
        <linearGradient id="evo-line" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
          <stop offset="12%" stopColor="var(--primary)" stopOpacity="0.7" />
          <stop offset="88%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* rastro difuso (brilho) */}
      <motion.path
        d="M 48 0 C 60 110, 36 220, 48 330 C 60 440, 36 550, 48 660 C 60 770, 36 880, 48 990 C 54 1060, 44 1130, 48 1200"
        fill="none"
        stroke="var(--primary)"
        strokeOpacity="0.2"
        strokeWidth="12"
        strokeLinecap="round"
        style={{ filter: "blur(5px)" }}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 2.2, ease: "easeInOut" }}
      />
      {/* linha principal */}
      <motion.path
        id="evo-path"
        d="M 48 0 C 60 110, 36 220, 48 330 C 60 440, 36 550, 48 660 C 60 770, 36 880, 48 990 C 54 1060, 44 1130, 48 1200"
        fill="none"
        stroke="url(#evo-line)"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true, margin: "-120px" }}
        transition={{ duration: 2.2, ease: "easeInOut" }}
      />
      {/* fagulha que percorre a trilha */}
      <circle r="5" fill="var(--primary)">
        <animateMotion dur="8s" repeatCount="indefinite">
          <mpath href="#evo-path" />
        </animateMotion>
      </circle>
      <circle r="10" fill="var(--primary)" opacity="0.25">
        <animateMotion dur="8s" repeatCount="indefinite">
          <mpath href="#evo-path" />
        </animateMotion>
      </circle>
    </svg>
  );
}

export function Features() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // O Fô avança sozinho pelos passos; pausa quando o mouse está num card.
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % features.length), 4000);
    return () => clearInterval(id);
  }, [paused]);

  const current = features[active];

  return (
    <section id="recursos" className="scroll-mt-24 border-y bg-muted/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Recursos"
          title="Tudo que um avanço pessoal precisa. Nada que atrapalhe."
          description="Feito pra quem quer progredir de verdade — sem gamificação vazia e sem tela cheia de botão."
        />

        {/* Fô explicando o passo ativo */}
        <Reveal className="mt-8">
          <div className="mx-auto flex max-w-2xl items-start gap-4 sm:items-center">
            <motion.div
              key={current.mood + active}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              className="shrink-0 rounded-full bg-primary/10 p-1.5"
            >
              <FoAvatar mood={current.mood} size={56} />
            </motion.div>

            <div
              className="relative min-h-20 flex-1 rounded-2xl border border-primary/25 bg-card p-4 shadow-sm"
              role="status"
              aria-live="polite"
            >
              {/* seta do balão */}
              <div className="absolute -left-1.5 top-6 size-3 rotate-45 border-b border-l border-primary/25 bg-card" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-primary">
                    Passo {active + 1} de {features.length} · {current.title}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{current.fo}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        {/* Trilha: cada passo plugado na linha, alternando os lados */}
        <div className="relative mt-10" onMouseLeave={() => setPaused(false)}>
          <TrailLine />

          <ol className="space-y-4 sm:space-y-5">
            {features.map((f, i) => {
              const isActive = active === i;
              const left = i % 2 === 0;
              return (
                <li key={f.title} className="relative">
                  <Reveal className="grid grid-cols-[3.5rem_1fr] items-center sm:grid-cols-2 sm:gap-x-16">
                    {/* nó numerado, em cima da linha */}
                    <span
                      className={cn(
                        "absolute left-6 top-1/2 z-10 flex size-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm font-semibold shadow-sm transition-colors duration-300 sm:left-1/2",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground shadow-[0_0_18px_color-mix(in_oklch,var(--primary)_45%,transparent)]"
                          : "border-primary/40 bg-card text-muted-foreground",
                      )}
                      aria-hidden
                    >
                      {i + 1}
                    </span>

                    {/* conector do card até o nó (só no desktop) */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-1/2 hidden h-px w-10 -translate-y-1/2 sm:block",
                        left
                          ? "right-1/2 bg-gradient-to-l from-primary/50 to-transparent"
                          : "left-1/2 bg-gradient-to-r from-primary/50 to-transparent",
                      )}
                    />

                    <div
                      onMouseEnter={() => {
                        setActive(i);
                        setPaused(true);
                      }}
                      className={cn(
                        "col-start-2 rounded-2xl border bg-card p-5 transition-colors duration-300",
                        left ? "sm:col-start-1 sm:mr-4" : "sm:col-start-2 sm:ml-4",
                        isActive &&
                          "border-primary/50 shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_15%,transparent)]",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors duration-300",
                            isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                          )}
                        >
                          <f.icon className="size-5" />
                        </div>
                        <h3 className="font-semibold tracking-tight">{f.title}</h3>
                      </div>
                      <p className="mt-2.5 text-sm text-muted-foreground">{f.text}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
