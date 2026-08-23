import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { PhoneFrame } from "@/components/app/phone-frame";
import { FoAvatar } from "@/components/avatar/fo-avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Foco — seu app, na web",
  description: "Acesse suas metas, passos do dia e troféus do Foco direto no navegador.",
};

/**
 * Versão web do app Foco.
 * No celular: tela cheia. No desktop: o app dentro de um iPhone.
 */
export default function AppPage() {
  return (
    <div className="relative min-h-dvh">
      {/* Fundo e cabeçalho só aparecem no desktop (no celular o app ocupa tudo). */}
      <div className="bg-grid mask-fade-b pointer-events-none absolute inset-0 -z-10 max-md:hidden" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl max-md:hidden" />

      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between px-4 sm:px-6 max-md:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <FoAvatar size={28} animate={false} />
          <span>Foco</span>
          <span className="ml-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            web
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft /> Voltar ao site
            </Link>
          </Button>
        </div>
      </header>

      <PhoneFrame padding={56}>
        <AppShell />
      </PhoneFrame>

      <p className="pointer-events-none fixed inset-x-0 bottom-4 z-20 text-center text-xs text-muted-foreground max-md:hidden">
        As mesmas metas, passos e troféus do seu celular — sincronizados.
      </p>
    </div>
  );
}
