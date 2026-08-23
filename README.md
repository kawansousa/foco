# Foco — monorepo

App de metas com prazo, check-in diário, diário de dificuldade, troféus e lembretes com o avatar **Fô**.

```
apps/
  api/       API HTTP (Hono + Drizzle/SQLite) usada pelo app e pelo site
  mobile/    App de celular (Expo + expo-router, iOS/Android)
  web/       Site/landing (Next.js 16)
packages/
  shared/    Tipos, schemas (zod), regras de progresso/sequência, catálogo de
             troféus, mensagens do Fô e cliente HTTP tipado
```

## Rodando tudo

Pré-requisitos: Node 20+, pnpm 9 (`corepack enable`), e para o celular o app **Expo Go** (ou um build de desenvolvimento).

```bash
pnpm install

# 1) API — http://localhost:4000 (cria apps/api/data/foco.db sozinha)
pnpm dev:api

# opcional: usuário de demonstração com metas e histórico
pnpm --filter @foco/api seed     # demo@foco.app / foco1234

# 2) Site — http://localhost:3000
pnpm dev:web

# 3) App mobile
pnpm dev:mobile                  # abre o Metro; escaneie o QR com o Expo Go
```

`pnpm dev` sobe API e site juntos.

### Como o app encontra a API

- **Celular físico (Expo Go)**: o app usa automaticamente o IP da máquina que está rodando o Metro, na porta 4000. Celular e computador precisam estar na mesma rede Wi-Fi.
- **Simulador iOS / emulador Android**: `localhost` / `10.0.2.2` automaticamente.
- Para forçar uma URL (ex.: API publicada), crie `apps/mobile/.env` com `EXPO_PUBLIC_API_URL=https://...`.

O site usa `NEXT_PUBLIC_API_URL` (`apps/web/.env.local`), padrão `http://localhost:4000`.

## Funcionalidades

| Recurso (como descrito no site) | Onde vive |
| --- | --- |
| Metas com prazo real (ou contínuas) e passo diário | `POST/GET/PATCH/DELETE /goals`, aba **Metas** |
| Check-in diário com um toque | `PUT /checkins`, aba **Hoje** |
| Diário de dificuldade (1–5) + comentário | modal **Como foi?** depois de marcar o passo |
| Troféus com data, contexto e comentário | `GET /trophies`, `PATCH /trophies/:id`, aba **Troféus** |
| Lembretes com o Fô (horários, tom leve/neutro/firme, dias de descanso, modo silencioso) | `GET/PUT /settings`, `GET /fo/schedule`, aba **Fô** → notificações locais |
| Progresso: constância, dificuldade média, dias fortes | `GET /stats`, aba **Progresso** |
| Lista de espera do site | `POST /waitlist` (formulário da landing) |

Regras de troféu (`apps/api/src/services/trophies.ts`): Primeiro passo, 7 dias seguidos, Superação (dia 5/5), Mês inteiro (30), Meta batida (concluída no prazo), Sem folga (todos os passos do dia), 100 dias e um troféu secreto.

Sequência e progresso são funções puras em `packages/shared/src/progress.ts` — dias de descanso não quebram a sequência.

## API

Autenticação por `Authorization: Bearer <token>` (JWT). Datas são `YYYY-MM-DD` no fuso do cliente (mande `?date=` nas rotas de leitura).

```
POST /auth/register {name,email,password}     POST /auth/login {email,password}     GET /me
GET  /goals?date=   POST /goals   GET|PATCH|DELETE /goals/:id   POST /goals/:id/complete
GET  /today?date=                              PUT /checkins {goalId,date,done,difficulty?,note?,localTime?}
GET  /checkins?from&to&goalId
GET  /trophies      PATCH /trophies/:id {note}
GET  /settings      PUT /settings
GET  /stats?date=   GET /fo/schedule?date=
POST /waitlist {email,source?}                 GET /health
```

Variáveis (`apps/api/.env.example`): `PORT`, `DATABASE_URL`, `JWT_SECRET` (obrigatório em produção), `CORS_ORIGINS`.

Migrations: `pnpm --filter @foco/api db:generate` após mudar `src/db/schema.ts`; elas rodam sozinhas ao subir a API.

## Scripts úteis

```bash
pnpm typecheck        # todos os pacotes
pnpm build            # site + API
pnpm --filter @foco/web lint
```

## Site (apps/web)

Next.js 16 (App Router) + Tailwind v4 + shadcn/ui + `motion`. A hero mostra uma demo interativa da tela "Hoje" dentro de um iPhone (`src/components/landing/phone-mockup.tsx`); o app de verdade é o `apps/mobile`.

- Cores: `src/app/globals.css` (`:root` e `.dark`).
- Textos: cada seção em `src/components/landing/*`.
- Avatar: `src/components/avatar/fo-avatar.tsx` (`mood`: `happy | wave | celebrate | sleepy | thinking`). A versão nativa está em `apps/mobile/src/components/fo-avatar.tsx`.
