import { CalendarRange, CheckCircle2, Trophy } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const steps = [
  {
    icon: CalendarRange,
    title: "Defina a meta e o prazo",
    text: "“Correr 10 km em 42 dias.” O Foco quebra o objetivo em passos diários do seu tamanho.",
  },
  {
    icon: CheckCircle2,
    title: "Marque o que concluiu, todo dia",
    text: "Um toque e pronto. Comente como foi e diga o quanto foi difícil — o app aprende seu ritmo.",
  },
  {
    icon: Trophy,
    title: "Conquiste troféus",
    text: "Sequências, marcos e superações viram troféus. Seu avanço fica visível — e dá vontade de continuar.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Como funciona"
          title="Três passos. Todos os dias."
          description="Simples o bastante pra não atrapalhar. Consistente o bastante pra mudar alguma coisa."
        />

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <li className="group relative h-full rounded-2xl border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <s.icon className="size-5" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
