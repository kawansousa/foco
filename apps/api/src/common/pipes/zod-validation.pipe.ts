import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";
import type { ApiErrorBody } from "@foco/shared";

/**
 * Valida o corpo da requisição com um schema zod de `@foco/shared` — o mesmo
 * que o app e o site usam nos formulários — e responde 400 com a lista de
 * problemas no formato `{ error, issues }`.
 *
 * Uso: `@Body(new ZodValidationPipe(createGoalSchema)) input: CreateGoalInput`
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    const issues: NonNullable<ApiErrorBody["issues"]> = result.error.issues.map((i) => ({
      path: i.path.map(String).join("."),
      message: i.message,
    }));
    throw new BadRequestException({ error: issues[0]?.message ?? "Dados inválidos.", issues } satisfies ApiErrorBody);
  }
}
