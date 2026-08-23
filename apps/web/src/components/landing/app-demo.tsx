import PhoneMockupBasic from "@/components/ui/phone-mockups-1";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

export function AppDemo() {
  return (
    <section id="demo" className="scroll-mt-24 overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Demonstração"
          title="Veja o Foco na tela do seu celular."
          description="Navegue pelas telas do app: metas com prazo, passos do dia, diário de dificuldade e troféus. Arraste, use as setas ou deixe rolar."
        />

        <Reveal className="mt-12">
          <div className="flex min-h-[600px] w-full items-center justify-center bg-background text-foreground">
            <PhoneMockupBasic />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
