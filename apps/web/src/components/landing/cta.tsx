"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ApiError } from "@foco/shared";
import { Button } from "@/components/ui/button";
import { FoAvatar } from "@/components/avatar/fo-avatar";
import { PhoneFrame, type ImageItem } from "@/components/ui/phone-mockups-1-utils/phone-carousel";
import { api } from "@/lib/api";
import { Reveal } from "./reveal";

type State = { status: "idle" | "sending" | "done"; message?: string; error?: string };

/** Prints reais do app (simulador iOS), em public/app. */
const screens: { left: ImageItem; center: ImageItem; right: ImageItem } = {
  left: {
    src: "/app/metas-light.png",
    srcDark: "/app/metas-dark.png",
    alt: "Tela Metas do Foco: lista de metas ativas com prazo, passo diário e barra de progresso",
  },
  center: {
    src: "/app/hoje-light.png",
    srcDark: "/app/hoje-dark.png",
    alt: "Tela Hoje do Foco: passos do dia com 4 de 5 concluídos e sequência de 13 dias",
  },
  right: {
    src: "/app/progresso-light.png",
    srcDark: "/app/progresso-dark.png",
    alt: "Tela Progresso do Foco: constância dos últimos 30 dias, dias fortes e dificuldade média",
  },
};

export function Cta() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  const submit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ status: "sending" });
    try {
      const res = await api.waitlist.join({ email, source: "landing" });
      setState({
        status: "done",
        message: res.alreadyJoined ? "Você já estava na lista — avisamos assim que liberar." : "Pronto! Você está na lista.",
      });
    } catch (err) {
      setState({
        status: "idle",
        error:
          err instanceof ApiError
            ? err.message
            : "Não consegui falar com o servidor agora. Tenta de novo em instantes.",
      });
    }
  };

  return (
    <section id="cta" className="scroll-mt-24 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground">
            <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-black/10 blur-3xl" />

            <div className="relative grid items-center gap-8 px-6 pt-14 sm:px-12 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:pt-0">
              {/* Texto + formulário */}
              <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:py-20 lg:text-left">
                <div className="mx-auto mb-6 w-fit rounded-full bg-white/15 p-2 lg:mx-0">
                  <FoAvatar mood={state.status === "done" ? "celebrate" : "wave"} size={72} />
                </div>
                <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  O próximo passo é pequeno. Começa hoje.
                </h2>
                <p className="mt-4 text-pretty text-primary-foreground/80">
                  Grátis pra começar. Sem cartão. Seus dados são seus.
                </p>

                {state.status === "done" ? (
                  <p
                    role="status"
                    className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-medium lg:mx-0"
                  >
                    <Check className="size-4" /> {state.message}
                  </p>
                ) : (
                  <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row lg:mx-0" onSubmit={submit}>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      aria-label="E-mail"
                      className="h-12 rounded-xl sm:flex-1 border border-white/20 bg-white/10 px-4 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/60 focus-visible:ring-[3px] focus-visible:ring-white/40"
                    />
                    <Button
                      size="lg"
                      type="submit"
                      disabled={state.status === "sending"}
                      className="bg-background text-foreground hover:bg-background/90 shadow-none"
                    >
                      {state.status === "sending" ? "Enviando…" : "Entrar na lista"} <ArrowRight />
                    </Button>
                  </form>
                )}
                {state.error && (
                  <p role="alert" className="mt-3 text-sm text-primary-foreground/90">
                    {state.error}
                  </p>
                )}
              </div>

              {/* Telas reais do app, "saindo" da borda inferior do cartão */}
              <div
                className="relative mx-auto h-[330px] w-full max-w-sm sm:h-[420px] lg:mx-0 lg:mt-0 lg:h-[480px] lg:max-w-none"
                role="group"
                aria-label="Telas do app Foco"
              >
                <div className="pointer-events-none absolute left-1/2 top-1/2 size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />

                <div className="absolute -bottom-28 left-1/2 hidden -translate-x-[calc(50%+140px)] -rotate-6 opacity-90 sm:block lg:-translate-x-[calc(50%+150px)]">
                  <PhoneFrame image={screens.left} notch={false} className="w-[190px] sm:w-[200px]" />
                </div>

                <div className="absolute -bottom-28 left-1/2 z-10 -translate-x-1/2 lg:-bottom-24">
                  <PhoneFrame image={screens.center} notch={false} priority className="w-[220px] sm:w-[250px]" />
                </div>

                <div className="absolute -bottom-28 left-1/2 hidden translate-x-[calc(-50%+140px)] rotate-6 opacity-90 sm:block lg:translate-x-[calc(-50%+150px)]">
                  <PhoneFrame image={screens.right} notch={false} className="w-[190px] sm:w-[200px]" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
