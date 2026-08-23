"use client";

import { IPhoneMockup } from "@/components/ui/iphone-mockup";
import { TodayScreen } from "@/components/app/today-screen";
import { cn } from "@/lib/utils";

/**
 * iPhone da hero: mostra a tela "Hoje" do app (interativa) dentro de um iPhone 15 Pro.
 * Escala fixa (0.72) para caber no grid da landing.
 */
export function PhoneMockup({ className }: { className?: string }) {
  return (
    <div className={cn("relative mx-auto w-fit", className)}>
      {/* glow */}
      <div className="absolute -inset-10 -z-10 rounded-full bg-primary/20 blur-3xl" />

      {/* 417x876 @ escala 0.72 ≈ 300x631 (cabe no grid sem overflow) */}
      <IPhoneMockup
        model="15-pro"
        color="space-black"
        scale={0.72}
        screenBg="var(--background)"
        innerShadow={false}
        shadow="0 30px 60px -12px rgba(0,0,0,0.4), 0 8px 20px -8px rgba(0,0,0,0.3)"
      >
        <TodayScreen demo />
      </IPhoneMockup>
    </div>
  );
}
