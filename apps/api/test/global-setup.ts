import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { TEMPLATE_DB, TEST_DB_DIR } from "./helpers/db-paths";

/**
 * Roda uma vez antes de toda a suíte: cria um banco SQLite "modelo" com as
 * migrations aplicadas. Cada arquivo de teste copia esse modelo para um
 * arquivo próprio (ver `test/setup-env.ts`), então os testes nunca
 * compartilham estado nem tocam no banco de desenvolvimento.
 */
export default function setup() {
  rmSync(TEST_DB_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DB_DIR, { recursive: true });
  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    cwd: resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: `file:${TEMPLATE_DB}` },
    stdio: "pipe",
  });

  return () => {
    rmSync(TEST_DB_DIR, { recursive: true, force: true });
  };
}
