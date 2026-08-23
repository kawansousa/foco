/**
 * Registra o SWC para compilar TypeScript em tempo de execução (API e seed).
 *
 * Só arquivos .ts/.mts/.cts passam pelo SWC. O padrão do @swc-node/register
 * também transpila .js, o que quebra quando alguma ferramenta injeta JS fora
 * do node_modules (ex.: a extensão Console Ninja do VS Code altera
 * node_modules/@nestjs/core/index.js e faz o SWC abortar com um panic).
 *
 * Uso: node -r ./register.cjs src/main.ts
 */
const { register } = require("@swc-node/register/register");

register({}, { exts: [".ts", ".mts", ".cts"] });
