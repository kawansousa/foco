import { randomUUID } from "node:crypto";
import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { TEMPLATE_DB, TEST_DB_DIR } from "./helpers/db-paths";

/**
 * `setupFiles` do Vitest: roda em cada processo de teste ANTES de importar o
 * arquivo de teste. Precisa ser aqui porque `ConfigModule.forRoot()` lê
 * `process.env` no momento em que `AppModule` é importado.
 *
 * Cada arquivo ganha uma cópia própria do banco modelo (ver global-setup.ts).
 */
if (existsSync(TEMPLATE_DB)) {
  const dbPath = resolve(TEST_DB_DIR, `${randomUUID()}.db`);
  copyFileSync(TEMPLATE_DB, dbPath);
  process.env.DATABASE_URL = `file:${dbPath}`;
}
process.env.NODE_ENV = "test";
// Sem rate limit na suíte (test/throttle.e2e-spec.ts baixa esses valores por conta própria)
process.env.RATE_LIMIT_AUTH_PER_MIN ??= "1000000";
process.env.RATE_LIMIT_PER_MIN ??= "1000000";
process.env.CORS_ORIGINS = "";
delete process.env.PORT;
