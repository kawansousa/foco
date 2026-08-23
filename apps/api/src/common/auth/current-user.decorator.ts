import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

export type AuthenticatedRequest = Request & { userId: string };

/** Id do usuário autenticado (preenchido pelo `JwtAuthGuard`). */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  return ctx.switchToHttp().getRequest<AuthenticatedRequest>().userId;
});
