import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
  UnauthorizedException,
  type ArgumentsHost,
} from "@nestjs/common";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ApiExceptionFilter } from "./api-exception.filter";

/** Executa o filtro e captura (status, body) enviados na resposta. */
function run(exception: unknown) {
  const res = { status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  const host = { switchToHttp: () => ({ getResponse: () => res }) } as unknown as ArgumentsHost;
  new ApiExceptionFilter().catch(exception, host);
  return { status: res.status.mock.calls[0][0] as number, body: res.json.mock.calls[0][0] as unknown };
}

describe("ApiExceptionFilter", () => {
  beforeAll(() => {
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
  });

  it("mantém { error, issues } vindo da validação", () => {
    const issues = [{ path: "email", message: "E-mail inválido" }];
    expect(run(new BadRequestException({ error: "E-mail inválido", issues }))).toEqual({
      status: 400,
      body: { error: "E-mail inválido", issues },
    });
  });

  it("converte exceções padrão do Nest usando a mensagem, não o nome do status", () => {
    expect(run(new UnauthorizedException("Faça login para continuar."))).toEqual({
      status: 401,
      body: { error: "Faça login para continuar." },
    });
    expect(run(new ConflictException("Já existe uma conta com esse e-mail."))).toEqual({
      status: 409,
      body: { error: "Já existe uma conta com esse e-mail." },
    });
  });

  it("404 de rota inexistente vira mensagem amigável", () => {
    expect(run(new NotFoundException("Cannot GET /nada"))).toEqual({
      status: 404,
      body: { error: "Rota não encontrada." },
    });
  });

  it("404 de domínio preserva a mensagem", () => {
    expect(run(new NotFoundException("Meta não encontrada."))).toEqual({
      status: 404,
      body: { error: "Meta não encontrada." },
    });
  });

  it("JSON inválido no corpo vira 400 amigável", () => {
    expect(run(new BadRequestException("Unexpected token } in JSON at position 1"))).toEqual({
      status: 400,
      body: { error: "Corpo da requisição precisa ser JSON." },
    });
  });

  it("erro do Express/body-parser (http-errors) mantém o status: 413 com mensagem amigável", () => {
    const tooLarge = Object.assign(new Error("request entity too large"), { status: 413, expose: true, type: "entity.too.large" });
    expect(run(tooLarge)).toEqual({ status: 413, body: { error: "Corpo da requisição grande demais." } });
    const unsupported = Object.assign(new Error("unsupported charset"), { status: 415, expose: true });
    expect(run(unsupported)).toEqual({ status: 415, body: { error: "unsupported charset" } });
  });

  it("erro inesperado vira 500 genérico sem vazar detalhes", () => {
    expect(run(new Error("segredo do banco"))).toEqual({ status: 500, body: { error: "Erro interno." } });
    expect(Logger.prototype.error).toHaveBeenCalled();
  });
});
