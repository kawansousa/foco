"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoAvatar, type FoMood } from "@/components/avatar/fo-avatar";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

const levels = [
  { v: 1, label: "Tranquilo", emoji: "😌" },
  { v: 2, label: "Leve", emoji: "🙂" },
  { v: 3, label: "Médio", emoji: "😐" },
  { v: 4, label: "Puxado", emoji: "😮‍💨" },
  { v: 5, label: "Muito difícil", emoji: "🥵" },
];

const replies: Record<number, { mood: FoMood; text: string }> = {
  1: { mood: "happy", text: "Dia leve é dia ganho. Guarda essa energia pro próximo passo!" },
  2: { mood: "happy", text: "Boa! Constância se constrói assim, sem drama." },
  3: { mood: "thinking", text: "Normal ter dia médio. O importante: você fez." },
  4: { mood: "wave", text: "Foi puxado e você não desistiu. Isso vale troféu, viu?" },
  5: { mood: "celebrate", text: "Dia muito difícil e ainda assim concluído. Respeito. 🏅" },
};

export function CheckinDemo() {
  const [done, setDone] = useState(false);
  const [level, setLevel] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const reply = level ? replies[level] : null;

  return (
    <section id="checkin" className="scroll-mt-24 overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <SectionHeading
            align="left"
            eyebrow="Diário do dia"
            title="Concluiu? Conta como foi."
            description="Depois de marcar um passo, você registra o quanto foi difícil e deixa um comentário. Esses registros viram o histórico da sua meta — e ajudam o Foco a ajustar o ritmo nos próximos dias."
          />

          <Reveal>
            <div className="relative mx-auto w-full max-w-md rounded-3xl border bg-card p-6 shadow-xl shadow-primary/5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Passo de hoje</p>

              <button
                type="button"
                onClick={() => {
                  setDone((d) => !d);
                  if (done) {
                    setLevel(null);
                    setSent(false);
                  }
                }}
                aria-pressed={done}
                className={cn(
                  "mt-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent",
                  done && "border-primary/30 bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-input",
                  )}
                >
                  {done && <Check className="size-4" strokeWidth={3} />}
                </span>
                <span>
                  <span className={cn("block font-medium", done && "text-muted-foreground line-through")}>
                    Estudar inglês por 25 min
                  </span>
                  <span className="block text-xs text-muted-foreground">Meta: Fluência B2 · 90 dias</span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {done && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-5">
                      <p className="text-sm font-medium">Quanto foi difícil hoje?</p>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {levels.map((l) => (
                          <button
                            key={l.v}
                            type="button"
                            onClick={() => setLevel(l.v)}
                            aria-pressed={level === l.v}
                            title={l.label}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border py-2 text-xl transition-all hover:bg-accent",
                              level === l.v && "border-primary bg-primary/10 ring-2 ring-primary/30",
                            )}
                          >
                            <span>{l.emoji}</span>
                            <span className="text-[10px] text-muted-foreground">{l.v}</span>
                          </button>
                        ))}
                      </div>
                      {level && (
                        <p className="mt-2 text-xs text-muted-foreground">{levels[level - 1].label}</p>
                      )}

                      <label className="mt-4 block text-sm font-medium" htmlFor="note">
                        Comentário
                      </label>
                      <div className="mt-2 flex gap-2">
                        <input
                          id="note"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Hoje rendeu, mas o listening ainda pega…"
                          className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        <Button size="icon" aria-label="Salvar registro" disabled={!level} onClick={() => setSent(true)}>
                          <Send />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {sent && reply && (
                  <motion.div
                    key="reply"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 flex items-start gap-3 rounded-2xl border bg-muted/50 p-3"
                  >
                    <FoAvatar mood={reply.mood} size={44} />
                    <div className="text-sm">
                      <p className="font-semibold">Fô</p>
                      <p className="text-muted-foreground">{reply.text}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!done && (
                <p className="mt-4 text-center text-xs text-muted-foreground">Marque o passo pra ver o registro ✨</p>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
