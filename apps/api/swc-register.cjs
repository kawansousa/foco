/**
 * Registro do SWC para rodar TypeScript direto: `node -r ./swc-register.cjs src/main.ts`.
 *
 * Diferente do `-r @swc-node/register` puro:
 *  - só arquivos .ts/.mts/.cts passam pelo SWC (o JS das dependências já é CommonJS);
 *  - nada em node_modules ou ~/.vscode é transpilado.
 *
 * Motivo: a extensão Console Ninja do VS Code injeta um "build hook" em
 * node_modules/@nestjs/core/index.js; ao tentar compilar esse JS o SWC morre com
 * `panicked at miette ... Formatting argument out of range`.
 */
const { register } = require("@swc-node/register/register");

const IGNORED = [/[\\/]\.vscode[\\/]extensions[\\/]/, /console-ninja/i, /[\\/]node_modules[\\/]/];

register(
  {},
  {
    exts: [".ts", ".mts", ".cts"],
    matcher: (filename) => !IGNORED.some((re) => re.test(filename)),
  },
);
