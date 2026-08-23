import type { ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerStorageRecord } from "@nestjs/throttler/dist/throttler-storage-record.interface";

type Entry = {
  hits: number;
  /** fim da janela atual (ms epoch) */
  expiresAt: number;
  /** até quando o cliente fica bloqueado (0 = não bloqueado) */
  blockedUntil: number;
};

const SWEEP_INTERVAL_MS = 60_000;

/**
 * Contadores de rate limit em memória, janela fixa por chave.
 *
 * Substitui o storage padrão do @nestjs/throttler, que nunca remove chaves do
 * Map (cada par IP+rota vira uma entrada eterna → memória cresce com tráfego
 * de bots) e arma um setTimeout por hit. Aqui: uma entrada por chave, expirada
 * na leitura e varrida periodicamente (timer com unref, não segura o processo).
 *
 * Limitação consciente: contadores por processo. Com várias réplicas o limite
 * efetivo é multiplicado pelo número delas; para limite global, trocar por um
 * storage compartilhado (ex.: Redis) — a interface é a mesma.
 */
export class MemoryThrottlerStorage implements ThrottlerStorage {
  private readonly entries = new Map<string, Entry>();
  private readonly sweeper: NodeJS.Timeout;

  constructor() {
    this.sweeper = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    this.sweeper.unref();
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now();
    let entry = this.entries.get(key);
    if (!entry || (entry.expiresAt <= now && entry.blockedUntil <= now)) {
      entry = { hits: 0, expiresAt: now + ttl, blockedUntil: 0 };
      this.entries.set(key, entry);
    }

    if (entry.blockedUntil > now) {
      return this.record(entry, now, true);
    }

    entry.hits += 1;
    if (entry.hits > limit) {
      entry.blockedUntil = now + (blockDuration > 0 ? blockDuration : ttl);
      return this.record(entry, now, true);
    }
    return this.record(entry, now, false);
  }

  /** Quantidade de chaves vivas (exposto para testes). */
  size(): number {
    return this.entries.size;
  }

  /** Remove entradas cuja janela e bloqueio já venceram (exposto para testes). */
  sweep(now = Date.now()): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now && entry.blockedUntil <= now) this.entries.delete(key);
    }
  }

  onApplicationShutdown(): void {
    clearInterval(this.sweeper);
  }

  private record(entry: Entry, now: number, isBlocked: boolean): ThrottlerStorageRecord {
    return {
      totalHits: entry.hits,
      timeToExpire: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000)),
      isBlocked,
      timeToBlockExpire: isBlocked ? Math.max(0, Math.ceil((entry.blockedUntil - now) / 1000)) : 0,
    };
  }
}
