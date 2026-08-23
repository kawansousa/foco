# Foco — landing page + app web

Landing page do **Foco**: app de metas com prazo, check-in diário, diário de dificuldade, troféus e lembretes com o avatar **Fô**.

O Foco é um app de celular; a mesma interface também roda na web em **`/app`** — no desktop ela aparece dentro de um iPhone (`IPhoneMockup`), e num celular de verdade ocupa a tela toda.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 com tema shadcn/ui em `oklch` (light/dark via `next-themes`)
- `motion` (Framer Motion) para animações
- `lucide-react` para ícones

## Rodando

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # build de produção
pnpm lint
```

## Estrutura

```
src/
  app/
    globals.css          # tokens de tema (oklch) + utilitários
    layout.tsx           # fontes, metadata, ThemeProvider
    page.tsx             # composição das seções da landing
    app/page.tsx         # versão web do app (/app)
  components/
    app/
      app-shell.tsx      # telas do app + barra de abas (Hoje, Metas, Troféus, Fô)
      today-screen.tsx   # tela "Hoje" (usada no app e na hero da landing)
      phone-frame.tsx    # iPhone no desktop / tela cheia no celular
    avatar/fo-avatar.tsx # mascote Fô (SVG animado, 5 expressões)
    landing/             # navbar, hero, how-it-works, features,
                         # checkin-demo, trophies, fo-section, cta, footer
    theme-toggle.tsx     # botão light/dark
    ui/                  # button, badge, card, iphone-mockup (estilo shadcn)
  lib/utils.ts           # cn()
```

## shadcn/ui

O projeto segue a estrutura do shadcn (`components.json` na raiz, componentes em `src/components/ui`, `cn()` em `src/lib/utils.ts`). Para adicionar componentes:

```bash
pnpm dlx shadcn@latest add dialog
```

## Personalizando

- Cores: edite as variáveis em `src/app/globals.css` (`:root` e `.dark`).
- Nome/textos: cada seção em `src/components/landing/*` tem seus textos inline.
- iPhone da web: `model`, `color` e `scale` em `src/components/app/phone-frame.tsx` (modelos: `14`, `14-pro`, `15`, `15-pro`, `x`, `plain`).
- Avatar: `src/components/avatar/fo-avatar.tsx` — `mood` aceita `happy | wave | celebrate | sleepy | thinking`.
