import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Injectable, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import type { Env } from "../config/env";
import { PrismaClient } from "../generated/prisma/client";

/**
 * Cliente Prisma compartilhado (SQLite via driver adapter better-sqlite3).
 * O caminho do banco vem da configuração validada (`DATABASE_URL`).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<Env, true>) {
    const path = config.get("databasePath", { infer: true });
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    super({ adapter: new PrismaBetterSqlite3({ url: path }) });
  }

  async onModuleInit() {
    await this.$connect();
    // WAL: leituras não bloqueiam escritas (melhor para API + seed/studio abertos ao mesmo tempo)
    await this.$queryRawUnsafe("PRAGMA journal_mode = WAL");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
