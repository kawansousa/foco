import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { configureApp } from "./app.setup";
import type { Env } from "./config/env";

async function bootstrap() {
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule));
  const config = app.get(ConfigService<Env, true>);
  const port = config.get("port", { infer: true });

  await app.listen(port, "0.0.0.0");

  const logger = new Logger("Foco");
  if (config.get("usingDevJwtSecret", { infer: true }) && config.get("nodeEnv", { infer: true }) !== "test") {
    logger.warn("JWT_SECRET não definido: usando o segredo de desenvolvimento. Defina JWT_SECRET antes de publicar.");
  }
  logger.log(`API rodando em http://localhost:${port}  (banco: ${config.get("databasePath", { infer: true })})`);
  if (!config.get("isProd", { infer: true })) {
    logger.log(`Dica: no celular físico, use o IP da sua máquina na rede (ex.: http://192.168.0.10:${port}).`);
  }
}

bootstrap().catch((err) => {
  new Logger("Foco").error("Falha ao iniciar a API", err instanceof Error ? err.stack : String(err));
  process.exit(1);
});
