"use client";

import { motion } from "motion/react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PhoneMockup } from "./phone-mockup";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-10" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8">
        <motion.div
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08 }}
          className="max-w-xl"
        >
          <motion.div variants={fadeUp}>
            <Badge variant="soft" className="mb-6 gap-1.5 py-1 pl-1.5 pr-3">
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                Novo
              </span>
              Agora com o Fô, seu lembrete amigável
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Metas com prazo. Progresso todo dia.{" "}
            <span className="text-primary">Troféus de verdade.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-pretty text-lg text-muted-foreground">
            O Foco transforma objetivos grandes em passos diários. Marque o que concluiu, registre como foi,
            diga o quanto foi difícil — e veja seu avanço virar conquista, um dia de cada vez.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <a href="#cta">
                Começar grátis <ArrowRight />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#recursos">
                <Sparkles /> Ver como funciona
              </a>
            </Button>
          </motion.div>

          <motion.dl variants={fadeUp} className="mt-10 grid grid-cols-3 gap-6 border-t pt-8">
            {[
              ["97%", "sentem mais constância"],
              ["4,9★", "nota média na loja"],
              ["1,2 mi", "passos concluídos"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-2xl font-semibold tracking-tight">{v}</dt>
                <dd className="text-xs text-muted-foreground">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <PhoneMockup />
        </motion.div>
      </div>
    </section>
  );
}
