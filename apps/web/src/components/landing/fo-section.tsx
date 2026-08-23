"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FoAvatar, type FoMood } from "@/components/avatar/fo-avatar";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

type Notif = { id: number; mood: FoMood; time: string; title: string; text: string };

const notifs: Notif[] = [
  { id: 1, mood: "wave", time: "07:30", title: "Bom dia! ☀️", text: "Hoje tem 4 passos. O primeiro é o mais fácil: 3 km de corrida." },
  { id: 2, mood: "thinking", time: "13:00", title: "Metade do dia", text: "2 de 4 feitos. O inglês de 25 min cabe depois do almoço?" },
  { id: 3, mood: "wave", time: "20:00", title: "Sequência em risco 🔥", text: "12 dias seguidos. Falta só 1 passo pra manter. Eu acredito." },
  { id: 4, mood: "celebrate", time: "21:12", title: "Dia completo!", text: "Troféu “Sem folga” desbloqueado. Agora conta como foi?" },
  { id: 5, mood: "sleepy", time: "22:30", title: "Descansa", text: "Nada pendente. Amanhã a gente continua. Boa noite 🌙" },
];

export function FoSection() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % notifs.length), 3200);
    return () => clearInterval(t);
  }, []);

  const current = notifs[active];

  return (
    <section id="fo" className="scroll-mt-24 overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-8 -z-10 rounded-full bg-primary/15 blur-3xl" />
              <div className="flex justify-center pb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.mood + current.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <FoAvatar mood={current.mood} size={140} />
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="space-y-3">
                {notifs.map((n, i) => {
                  const isActive = i === active;
                  return (
                    <motion.button
                      key={n.id}
                      type="button"
                      onClick={() => setActive(i)}
                      animate={{ opacity: isActive ? 1 : 0.55, scale: isActive ? 1 : 0.97 }}
                      className="flex w-full items-start gap-3 rounded-2xl border bg-card p-3 text-left shadow-sm"
                    >
                      <FoAvatar mood={n.mood} size={36} animate={isActive} />
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold">{n.title}</p>
                          <span className="shrink-0 text-[11px] text-muted-foreground">{n.time}</span>
                        </div>
                        <p className="text-muted-foreground">{n.text}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              eyebrow="Conheça o Fô"
              title="Lembretes com cara, não com ruído."
              description="O Fô é o avatar do Foco. Ele aparece na hora certa, com o tom certo: anima de manhã, puxa a orelha quando a sequência está em risco e comemora junto quando você fecha o dia. Você escolhe os horários — ele cuida do resto."
            />
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Horários personalizados por meta",
                "Tom adaptável: leve, neutro ou firme",
                "Alerta de sequência em risco antes de perder o dia",
                "Modo silencioso nos dias de descanso",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
