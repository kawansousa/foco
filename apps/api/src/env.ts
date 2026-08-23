const DEV_SECRET = "foco-dev-secret-nao-use-em-producao";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? "./data/foco.db",
  jwtSecret: process.env.JWT_SECRET ?? DEV_SECRET,
  corsOrigins: (process.env.CORS_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  isProd: process.env.NODE_ENV === "production",
};

if (env.isProd && env.jwtSecret === DEV_SECRET) {
  throw new Error("JWT_SECRET precisa ser definido em produção.");
}
