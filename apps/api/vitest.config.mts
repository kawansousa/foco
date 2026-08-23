import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // SWC em vez do esbuild padrão: o Nest precisa de `emitDecoratorMetadata`
  plugins: [swc.vite({ module: { type: "es6" } })],
  test: {
    include: ["src/**/*.spec.ts", "test/**/*.e2e-spec.ts"],
    globalSetup: ["test/global-setup.ts"],
    setupFiles: ["test/setup-env.ts"],
    // cada arquivo roda em processo próprio: banco SQLite isolado + módulo nativo (better-sqlite3) seguro
    pool: "forks",
    testTimeout: 15_000,
    hookTimeout: 30_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/generated/**", "src/main.ts"],
      reporter: ["text", "html"],
      // `pnpm test:cov` falha se a cobertura cair abaixo disto
      thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
    },
  },
});
