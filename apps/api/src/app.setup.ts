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
  const trustProxy = config.get("trustProxy", { infer: true });
  if (trustProxy !== undefined) app.set("trust proxy", trustProxy);
  app.useBodyParser("json", { limit: JSON_BODY_LIMIT });
  const origins = config.get("corsOrigins", { infer: true });
  app.enableCors({
    origin: origins.length ? origins : "*",
    allowedHeaders: ["Authorization", "Content-Type"],
    // sem isso, JS cross-origin não lê o Retry-After dos 429 (não é header safelisted)
    exposedHeaders: ["Retry-After"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.enableShutdownHooks();
  return app;
}
