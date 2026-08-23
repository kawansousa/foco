import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

/** Raiz do pacote `apps/api` (onde ficam `prisma/`, `data/` e `.env`). */
export const API_ROOT = resolve(__dirname, "../..");

export const DEFAULT_DATABASE_URL = "file:./data/foco.db";

/** Carrega `apps/api/.env` (se existir) sem sobrescrever variáveis já definidas. */
export function loadDotEnv(root = API_ROOT): void {
  const file = resolve(root, ".env");
  if (!existsSync(file)) return;
  try {
    process.loadEnvFile(file);
  } catch {
    /* arquivo malformado: ignora e segue com o ambiente atual */
  }
}

/**
 * Normaliza a URL do banco SQLite para um caminho absoluto, assim o Prisma CLI
 * (rodando em `apps/api`) e a API (rodando de qualquer cwd) abrem o MESMO arquivo.
 *
 * Aceita `file:./data/foco.db`, `./data/foco.db`, `/abs/foco.db` e `:memory:`.
 */
export function resolveSqlitePath(url: string = DEFAULT_DATABASE_URL, root = API_ROOT): string {
  const raw = url.startsWith("file:") ? url.slice("file:".length) : url;
  if (raw === ":memory:") return raw;
  return isAbsolute(raw) ? raw : resolve(root, raw);
}
