import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryThrottlerStorage } from "./throttle-storage";

const TTL = 60_000;

describe("MemoryThrottlerStorage", () => {
  let storage: MemoryThrottlerStorage;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
    storage = new MemoryThrottlerStorage();
  });
  afterEach(() => {
    storage.onApplicationShutdown();
    vi.useRealTimers();
  });

  it("conta hits e bloqueia ao passar do limite, com Retry-After correto", async () => {
    for (let i = 1; i <= 3; i++) {
      const r = await storage.increment("k", TTL, 3, TTL, "default");
      expect(r).toMatchObject({ totalHits: i, isBlocked: false });
    }
    const blocked = await storage.increment("k", TTL, 3, TTL, "default");
    expect(blocked.isBlocked).toBe(true);
    expect(blocked.timeToBlockExpire).toBe(60);
    // bloqueado não acumula mais hits
    const again = await storage.increment("k", TTL, 3, TTL, "default");
    expect(again).toMatchObject({ isBlocked: true, totalHits: 4 });
  });

  it("janela expira e o contador recomeça", async () => {
    await storage.increment("k", TTL, 3, TTL, "default");
    vi.advanceTimersByTime(TTL + 1);
    const r = await storage.increment("k", TTL, 3, TTL, "default");
    expect(r).toMatchObject({ totalHits: 1, isBlocked: false });
  });

  it("bloqueio termina depois de blockDuration e destrava", async () => {
    for (let i = 0; i < 4; i++) await storage.increment("k", TTL, 3, 30_000, "default");
    vi.advanceTimersByTime(TTL + 1); // janela E bloqueio vencidos
    const r = await storage.increment("k", TTL, 3, 30_000, "default");
    expect(r.isBlocked).toBe(false);
  });

  it("chaves expiradas são removidas (nada de Map crescendo para sempre)", async () => {
    for (let i = 0; i < 50; i++) await storage.increment(`ip-${i}`, TTL, 100, TTL, "default");
    expect(storage.size()).toBe(50);
    vi.advanceTimersByTime(TTL + SWEEP_MARGIN);
    storage.sweep();
    expect(storage.size()).toBe(0);
  });

  it("chaves são independentes", async () => {
    for (let i = 0; i < 4; i++) await storage.increment("a", TTL, 3, TTL, "default");
    const other = await storage.increment("b", TTL, 3, TTL, "default");
    expect(other).toMatchObject({ totalHits: 1, isBlocked: false });
  });
});

const SWEEP_MARGIN = 1;
