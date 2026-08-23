import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../../users/users.service";
import type { AuthenticatedRequest } from "./current-user.decorator";
import { IS_PUBLIC_KEY } from "./public.decorator";

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

    const userId = await this.verify(token);
    // Token válido mas conta apagada: trata como não autenticado (evita FK quebrada e 500 nas escritas)
    if (!userId || !(await this.users.exists(userId))) {
      throw new UnauthorizedException("Faça login para continuar.");
    }
    req.userId = userId;
    return true;
  }

  /** Id do usuário no token, ou null se o token for inválido/expirado. */
  private async verify(token: string): Promise<string | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: string }>(token);
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
