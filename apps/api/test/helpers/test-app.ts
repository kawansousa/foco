import { rmSync } from "node:fs";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import request, { type Agent } from "supertest";
import type { CreateGoalInput, RegisterInput } from "@foco/shared";
import { AppModule } from "../../src/app.module";
import { configureApp } from "../../src/app.setup";
import { Clock } from "../../src/common/clock/clock";
import type { Env } from "../../src/config/env";
import { PrismaService } from "../../src/prisma/prisma.service";
import { TEST_DB_DIR } from "./db-paths";
import { FixedClock } from "./fixed-clock";

/** "Hoje" no relógio fixo dos testes (ver `FixedClock`). */
export const TODAY = "2026-03-10";

export type TestApp = {
  app: NestExpressApplication;
  http: Agent;
  prisma: PrismaService;
  clock: FixedClock;
  close: () => Promise<void>;
};

/**
 * Sobe a aplicação inteira (módulos, guard, filtro, CORS) contra o banco
 * SQLite exclusivo deste arquivo de teste (preparado em `test/setup-env.ts`),
 * com o relógio congelado.
 */
export async function createTestApp(): Promise<TestApp> {
  const clock = new FixedClock();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Clock)
    .useValue(clock)
    .compile();

  const app = configureApp(moduleRef.createNestApplication<NestExpressApplication>({ logger: false }));

  // Trava de segurança: nunca rodar a suíte contra um banco fora da pasta de testes.
  const dbPath = app.get(ConfigService<Env, true>).get("databasePath", { infer: true });
  if (!dbPath.startsWith(TEST_DB_DIR)) {
    throw new Error(`Banco de teste fora de ${TEST_DB_DIR}: ${dbPath}. O setup-env.ts rodou?`);
  }

  // Escuta numa porta efêmera: com o servidor já ativo, o supertest não tenta
  // chamar `listen()` a cada requisição (o que quebra requisições concorrentes).
  await app.listen(0, "127.0.0.1");

  return {
    app,
    http: request(app.getHttpServer()),
    prisma: app.get(PrismaService),
    clock,
    close: async () => {
      await app.close();
      rmSync(dbPath, { force: true });
    },
  };
}

export type TestUser = { token: string; id: string; email: string; auth: { Authorization: string } };

let userSeq = 0;

/** Cria uma conta via API e devolve o token pronto para usar nos headers. */
export async function registerUser(http: Agent, overrides: Partial<RegisterInput> = {}): Promise<TestUser> {
  userSeq += 1;
  const input: RegisterInput = {
    name: `Pessoa ${userSeq}`,
    email: `pessoa${userSeq}@teste.dev`,
    password: "senha-forte-123",
    ...overrides,
  };
  const res = await http.post("/auth/register").send(input).expect(201);
  return { token: res.body.token, id: res.body.user.id, email: res.body.user.email, auth: bearer(res.body.token) };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Cria uma meta ativa desde bem antes de `TODAY`, sem prazo (salvo override). */
export async function createGoal(http: Agent, user: TestUser, overrides: Partial<CreateGoalInput> = {}) {
  const input: CreateGoalInput = {
    title: "Ler mais",
    stepTitle: "Ler 20 páginas",
    startDate: "2026-01-01",
    dueDate: null,
    ...overrides,
  };
  const res = await http.post("/goals").set(user.auth).send(input).expect(201);
  return res.body as { id: string; startDate: string; dueDate: string | null; status: string };
}

/** Registra um check-in concluído (ou não) para a meta no dia. */
export async function checkin(
  http: Agent,
  user: TestUser,
  goalId: string,
  date: string,
  extra: { done?: boolean; difficulty?: number | null; note?: string | null; localTime?: string } = {},
) {
  const res = await http
    .put("/checkins")
    .set(user.auth)
    .send({ goalId, date, done: true, ...extra })
    .expect(200);
  return res.body;
}
