"use client";

import { useEffect, useState, type ReactNode } from "react";
import { IPhoneMockup, getIPhoneOuterSize, type IPhoneMockupProps } from "@/components/ui/iphone-mockup";
import { cn } from "@/lib/utils";

const MOBILE_QUERY = "(max-width: 767px)";

type Props = {
  children: ReactNode;
  /** Modelo do iPhone usado na web. */
  model?: IPhoneMockupProps["model"];
  /** Margem (px) em volta do aparelho ao calcular a escala. */
  padding?: number;
  className?: string;
};

/**
 * Moldura do app na web.
 *
 * - Em telas pequenas (celular de verdade) renderiza o conteúdo em tela cheia,
 *   respeitando as safe areas do próprio aparelho.
 * - Em telas maiores renderiza o conteúdo dentro de um iPhone, escalado para
 *   caber na viewport — a mesma experiência do app, só que no navegador.
 */
export function PhoneFrame({ children, model = "15-pro", padding = 40, className }: Props) {
  const [mode, setMode] = useState<"pending" | "mobile" | "desktop">("pending");
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const { width, height } = getIPhoneOuterSize(model);

    const update = () => {
      setMode(mq.matches ? "mobile" : "desktop");
      const availW = window.innerWidth - padding * 2;
      const availH = window.innerHeight - padding * 2;
      setScale(Math.min(1, availW / width, availH / height));
    };

    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, [model, padding]);

  if (mode === "mobile") {
    return (
      <div
        className={cn(
          "fixed inset-0 flex flex-col bg-background pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-dvh items-center justify-center transition-opacity duration-300",
        mode === "pending" ? "opacity-0" : "opacity-100",
        className,
      )}
      style={{ padding }}
    >
      <IPhoneMockup
        model={model}
        color="space-black"
        scale={scale}
        screenBg="var(--background)"
        innerShadow={false}
        shadow="0 30px 60px -12px rgba(0,0,0,0.45), 0 8px 20px -8px rgba(0,0,0,0.3)"
      >
        {children}
      </IPhoneMockup>
    </div>
  );
}
