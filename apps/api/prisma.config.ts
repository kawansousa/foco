import { defineConfig } from "prisma/config";
import { loadDotEnv, resolveSqlitePath } from "./src/config/database-url";

loadDotEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node -r @swc-node/register prisma/seed.ts",
  },
  datasource: {
    url: `file:${resolveSqlitePath(process.env.DATABASE_URL)}`,
  },
});
