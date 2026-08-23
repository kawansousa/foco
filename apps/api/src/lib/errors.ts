import type { Context } from "hono";
import type { ZodType } from "zod";
import type { ApiErrorBody } from "@foco/shared";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public issues?: ApiErrorBody["issues"],
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const notFound = (what = "Registro") => new HttpError(404, `${what} não encontrado.`);

/** Lê e valida o corpo JSON com um schema zod; lança 400 com os problemas. */
export async function parseBody<T>(c: Context, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new HttpError(400, "Corpo da requisição precisa ser JSON.");
  }
  return parseWith(schema, raw);
}

export function parseWith<T>(schema: ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({ path: i.path.map(String).join("."), message: i.message }));
    throw new HttpError(400, issues[0]?.message ?? "Dados inválidos.", issues);
  }
  return result.data;
}
