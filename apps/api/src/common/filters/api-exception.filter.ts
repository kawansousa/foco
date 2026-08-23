import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import type { Response } from "express";
import type { ApiErrorBody } from "@foco/shared";

/**
 * Converte qualquer exceção no formato que os clientes (`@foco/shared`) esperam:
 * `{ error: string, issues?: { path, message }[] }`.
 *
 * - `HttpException` com corpo já nesse formato passa direto.
 * - `HttpException` padrão do Nest (`{ statusCode, message }`) vira `{ error: message }`.
 * - Qualquer outra coisa é 500 genérico (detalhes só no log, nunca na resposta).
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.normalize(exception);
    if (status >= 500) this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    res.status(status).json(body);
  }

  private normalize(exception: unknown): { status: number; body: ApiErrorBody } {
    // Erros do body-parser/Express (http-errors): ex. corpo acima do limite → 413
    if (isHttpError(exception)) {
      const friendly = exception.status === HttpStatus.PAYLOAD_TOO_LARGE ? "Corpo da requisição grande demais." : exception.message;
      return { status: exception.status, body: { error: friendly } };
    }
    if (!(exception instanceof HttpException)) {
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, body: { error: "Erro interno." } };
    }
    const status = exception.getStatus();
    const payload = exception.getResponse();

    if (typeof payload === "string") return { status, body: { error: payload } };

    const obj = payload as Partial<ApiErrorBody> & { statusCode?: number; message?: string | string[] };
    // Nosso formato: `{ error, issues? }` (sem statusCode) passa direto.
    if (typeof obj.error === "string" && obj.statusCode === undefined) {
      return { status, body: { error: obj.error, ...(obj.issues && { issues: obj.issues }) } };
    }
    // Formato padrão do Nest: `{ statusCode, message, error }` → a mensagem é o que importa.
    const message = Array.isArray(obj.message) ? obj.message[0] : (obj.message ?? exception.message);
    // JSON inválido: o Nest converte o SyntaxError do body-parser em BadRequest com a mensagem do V8
    if (status === HttpStatus.BAD_REQUEST && /\bJSON\b/.test(message)) {
      return { status, body: { error: "Corpo da requisição precisa ser JSON." } };
    }
    // 404 gerado pelo roteador do Nest ("Cannot GET /x") → mensagem amigável
    if (status === HttpStatus.NOT_FOUND && /^Cannot [A-Z]+ /.test(message)) {
      return { status, body: { error: "Rota não encontrada." } };
    }
    return { status, body: { error: message } };
  }
}

/** Erro no formato do pacote `http-errors` (usado pelo Express/body-parser): status 4xx exposto ao cliente. */
function isHttpError(err: unknown): err is Error & { status: number; expose: boolean } {
  if (!(err instanceof Error)) return false;
  const e = err as Error & { status?: unknown; expose?: unknown };
  return typeof e.status === "number" && e.status >= 400 && e.status < 500 && e.expose === true;
}
