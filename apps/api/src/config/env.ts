import { z } from "zod";
import { DEFAULT_DATABASE_URL, resolveSqlitePath } from "./database-url";

const DEV_JWT_SECRET = "foco-dev-secret-nao-use-em-producao";

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(0).max(65535).default(4000),
    DATABASE_URL: z.string().min(1).default(DEFAULT_DATABASE_URL),
    JWT_SECRET: z.string().min(1).default(DEV_JWT_SECRET),
    /** Origens permitidas (CORS), separadas por vírgula. Vazio = todas. */
    CORS_ORIGINS: z.string().default(""),
    /**
     * Atrás de proxy reverso: quantos saltos confiar para o IP real
     * (ex.: 1) ou "true"/"loopback" — vira o `trust proxy` do Express.
     * Vazio = desligado (padrão; correto quando a API é exposta direto).
     */
    TRUST_PROXY: z.string().default(""),
    /** Limite por IP e minuto nas rotas de login/cadastro. */
    RATE_LIMIT_AUTH_PER_MIN: z.coerce.number().int().min(1).default(10),
    /** Limite por IP e minuto nas demais rotas. */
    RATE_LIMIT_PER_MIN: z.coerce.number().int().min(1).default(300),
  })
  .transform((raw) => ({
    nodeEnv: raw.NODE_ENV,
    isProd: raw.NODE_ENV === "production",
    port: raw.PORT,
    /** Caminho absoluto do arquivo SQLite (ou ":memory:"). */
    databasePath: resolveSqlitePath(raw.DATABASE_URL),
    jwtSecret: raw.JWT_SECRET,
    usingDevJwtSecret: raw.JWT_SECRET === DEV_JWT_SECRET,
    jwtExpiresIn: "90d" as const,
    trustProxy: parseTrustProxy(raw.TRUST_PROXY),
    rateLimitAuthPerMin: raw.RATE_LIMIT_AUTH_PER_MIN,
    rateLimitPerMin: raw.RATE_LIMIT_PER_MIN,
    corsOrigins: raw.CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  }))
  .refine((env) => !(env.isProd && env.jwtSecret === DEV_JWT_SECRET), {
    message: "JWT_SECRET precisa ser definido em produção.",
  });

export type Env = z.infer<typeof envSchema>;

/** "" → desligado; "true"/"false" → booleano; número → saltos; resto → repassado (ex.: "loopback"). */
function parseTrustProxy(raw: string): boolean | number | string | undefined {
  const v = raw.trim();
  if (!v) return undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return /^\d+$/.test(v) ? Number(v) : v;
}

/**
 * Valida as variáveis de ambiente e falha cedo (na subida) se algo estiver errado.
 * Usada pelo `ConfigModule.forRoot({ validate })`.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues.map((i) => `${i.path.join(".") || "env"}: ${i.message}`).join("\n");
    throw new Error(`Configuração inválida:\n${problems}`);
  }
  return result.data;
}
