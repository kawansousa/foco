import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "./config/env";

/**
 * Configuração da aplicação HTTP compartilhada entre `main.ts` e os testes e2e,
 * para que os testes exercitem exatamente o que roda em produção.
 * (Guard de auth e filtro de erros são registrados por DI no `AppModule`.)
 */
export function configureApp(app: INestApplication): INestApplication {
  const config = app.get(ConfigService<Env, true>);
  const origins = config.get("corsOrigins", { infer: true });
  app.enableCors({
    origin: origins.length ? origins : "*",
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.enableShutdownHooks();
  return app;
}
