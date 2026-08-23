import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./env";
import { HttpError } from "./lib/errors";
import { authRoutes } from "./routes/auth";
import { focoRoutes } from "./routes/foco";
import { waitlistRoutes } from "./routes/waitlist";

export const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: env.corsOrigins.length ? env.corsOrigins : "*",
    allowHeaders: ["Authorization", "Content-Type"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.get("/", (c) => c.json({ name: "Foco API", docs: "/health" }));
app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

app.route("/", waitlistRoutes);
app.route("/", authRoutes);
app.route("/", focoRoutes);

app.notFound((c) => c.json({ error: "Rota não encontrada." }, 404));

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: err.message, ...(err.issues && { issues: err.issues }) }, err.status as 400);
  }
  console.error(err);
  return c.json({ error: "Erro interno." }, 500);
});
