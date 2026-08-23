import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../../users/users.service";
import type { AuthenticatedRequest } from "./current-user.decorator";
import { IS_PUBLIC_KEY } from "./public.decorator";

/** Conteúdo do JWT: `sub` = id do usuário, `ver` = versão do token (revogação). */
export type TokenPayload = { sub?: string; ver?: number };

/**
 * Guard global: exige `Authorization: Bearer <token>` em toda rota que não
 * esteja marcada com `@Public()`, confirma que a conta ainda existe e injeta
 * `req.userId`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    if (!token) throw new UnauthorizedException("Faça login para continuar.");

    const claims = await this.verify(token);
    // Conta apagada ou token revogado ("sair de todos os dispositivos"): não autenticado
    const state = claims ? await this.users.findAuthState(claims.userId) : null;
    if (!claims || !state || state.tokenVersion !== claims.version) {
      throw new UnauthorizedException("Faça login para continuar.");
    }
    req.userId = claims.userId;
    return true;
  }

  /** Claims do token, ou null se for inválido/expirado. */
  private async verify(token: string): Promise<{ userId: string; version: number } | null> {
    try {
      const payload = await this.jwt.verifyAsync<TokenPayload>(token);
      if (!payload.sub) return null;
      return { userId: payload.sub, version: payload.ver ?? 0 };
    } catch {
      return null;
    }
  }
}
