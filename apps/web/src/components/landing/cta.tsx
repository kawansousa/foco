"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ApiError } from "@foco/shared";
import { Button } from "@/components/ui/button";
import { FoAvatar } from "@/components/avatar/fo-avatar";
import { api } from "@/lib/api";
import { Reveal } from "./reveal";

type State = { status: "idle" | "sending" | "done"; message?: string; error?: string };

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
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
            <div className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 size-80 rounded-full bg-black/10 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto mb-6 w-fit rounded-full bg-white/15 p-2">
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
                  className="mx-auto mt-8 flex w-fit items-center gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm font-medium"
                >
                  <Check className="size-4" /> {state.message}
                </p>
              ) : (
                <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={submit}>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    aria-label="E-mail"
                    className="h-12 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-sm text-primary-foreground outline-none placeholder:text-primary-foreground/60 focus-visible:ring-[3px] focus-visible:ring-white/40"
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
          </div>
        </Reveal>
      </div>
    </section>
  );
}
