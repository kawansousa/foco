import { serve } from "@hono/node-server";
import { app } from "./app";
import { env } from "./env";

serve({ fetch: app.fetch, port: env.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`Foco API rodando em http://localhost:${info.port}  (banco: ${env.databaseUrl})`);
  if (!env.isProd) {
    console.log("Dica: no celular físico, use o IP da sua máquina na rede (ex.: http://192.168.0.10:%d).", info.port);
  }
});
