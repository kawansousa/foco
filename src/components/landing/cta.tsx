"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoAvatar } from "@/components/avatar/fo-avatar";
import { Reveal } from "./reveal";

export function Cta() {
  return (
    <section id="cta" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
            <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-black/10 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto mb-6 w-fit rounded-full bg-white/15 p-2">
                <FoAvatar mood="celebrate" size={72} />
              </div>
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                O próximo passo é pequeno. Começa hoje.
              </h2>
              <p className="mt-4 text-pretty text-primary-foreground/80">
                Grátis pra começar. Sem cartão. Seus dados são seus.
              </p>
              <form
                className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  aria-label="E-mail"
                  className="h-12 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/60 focus-visible:ring-[3px] focus-visible:ring-white/40"
                />
                <Button
                  size="lg"
                  type="submit"
                  className="bg-background text-foreground hover:bg-background/90 shadow-none"
                >
                  Entrar na lista <ArrowRight />
                </Button>
              </form>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
