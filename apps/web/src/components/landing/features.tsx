import { Target, ListChecks, Trophy, MessageSquareText, BellRing, LineChart } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const features = [
  {
    icon: Target,
    title: "Metas com prazo real",
    text: "Defina o objetivo, a data e o ritmo. O Foco calcula quantos passos cabem em cada dia.",
  },
  {
    icon: ListChecks,
    title: "Check-in diário",
    text: "A lista do dia, sempre à mão. Concluiu? Um toque. Não deu? Tudo bem, amanhã continua.",
  },
  {
    icon: MessageSquareText,
    title: "Diário de dificuldade",
    text: "Comente como foi e marque de 1 a 5 o quanto foi difícil. Com o tempo, você enxerga padrões.",
  },
  {
    icon: Trophy,
    title: "Troféus que contam história",
    text: "Sequências, superações e marcos viram conquistas — cada uma com a data e o seu comentário.",
  },
  {
    icon: BellRing,
    title: "Lembretes com o Fô",
    text: "Notificações no horário certo, com a cara do Fô: firmes quando precisa, leves quando não.",
  },
  {
    icon: LineChart,
    title: "Progresso que você vê",
    text: "Gráficos de constância, dificuldade média e dias fortes. Dados que explicam o seu avanço.",
  },
];

export function Features() {
  return (
    <section id="recursos" className="scroll-mt-24 border-y bg-muted/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Recursos"
          title="Tudo que um avanço pessoal precisa. Nada que atrapalhe."
          description="Feito pra quem quer progredir de verdade — sem gamificação vazia e sem tela cheia de botão."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div className="h-full rounded-2xl border bg-card p-6">
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
