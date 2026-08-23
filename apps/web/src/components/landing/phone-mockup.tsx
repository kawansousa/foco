"use client";

import { IPhoneMockup } from "@/components/ui/iphone-mockup";
import { TodayScreen } from "./today-screen";
import { cn } from "@/lib/utils";

/**
 * iPhone da hero: mostra a tela "Hoje" do app (interativa) dentro de um iPhone 15 Pro.
 * Escala fixa (0.62) para caber na dobra (hero de uma tela).
 */
export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-fit", className)}>
      {/* glow */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/20 blur-3xl" />

      {/* 417x876 @ escala 0.62 ≈ 259x543 (cabe na hero de uma tela) */}
      <IPhoneMockup
        model="15-pro"
        color="space-black"
        scale={0.62}
        style={{ display: "block" }}
        screenBg="var(--background)"
        innerShadow={false}
        shadow="0 30px 60px -12px rgba(0,0,0,0.4), 0 8px 20px -8px rgba(0,0,0,0.3)"
      >
        <TodayScreen demo />
      </IPhoneMockup>
    </div>
  );
}
