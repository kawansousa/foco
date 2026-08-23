import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { Env } from "./config/env";

/** Limite do corpo JSON: a foto de perfil vai como data URL (até ~400KB). */
export const JSON_BODY_LIMIT = "1mb";

/**
 * Configuração da aplicação HTTP compartilhada entre `main.ts` e os testes e2e,
 * para que os testes exercitem exatamente o que roda em produção.
 * (Guard de auth e filtro de erros são registrados por DI no `AppModule`.)
 */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  const config = app.get(ConfigService<Env, true>);
  app.useBodyParser("json", { limit: JSON_BODY_LIMIT });
  const origins = config.get("corsOrigins", { infer: true });
  app.enableCors({
    origin: origins.length ? origins : "*",
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.enableShutdownHooks();
  return app;
}
