import { type ExecutionContext, SetMetadata } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { Reflector } from "@nestjs/core";
import type { ThrottlerModuleOptions } from "@nestjs/throttler";
import type { Env } from "../config/env";
import { MemoryThrottlerStorage } from "./throttle-storage";

const STRICT_THROTTLE_KEY = "strictThrottle";

/** Rota sensível (login, cadastro): limite por IP bem menor (`RATE_LIMIT_AUTH_PER_MIN`). */
export const StrictThrottle = () => SetMetadata(STRICT_THROTTLE_KEY, true);

/**
 * Limitador por IP, janela de 1 minuto:
 *  - rotas com `@StrictThrottle()` compartilham UM balde por IP (login + cadastro
 *    somam no mesmo limite `RATE_LIMIT_AUTH_PER_MIN`);
 *  - as demais têm `RATE_LIMIT_PER_MIN` por IP e por rota.
 *
 * Atrás de proxy reverso, configure `TRUST_PROXY` para o `req.ip` ser o do
 * cliente real (senão todo mundo divide o mesmo balde do IP do proxy).
 */
export function throttlerOptions(config: ConfigService<Env, true>, reflector: Reflector): ThrottlerModuleOptions {
  const strictLimit = config.get("rateLimitAuthPerMin", { infer: true });
  const generalLimit = config.get("rateLimitPerMin", { infer: true });
  const isStrict = (ctx: ExecutionContext) =>
    reflector.getAllAndOverride<boolean>(STRICT_THROTTLE_KEY, [ctx.getHandler(), ctx.getClass()]) === true;

  return {
    storage: new MemoryThrottlerStorage(),
    errorMessage: "Muitas tentativas. Aguarde um minuto e tente de novo.",
    throttlers: [
      {
        ttl: 60_000,
        limit: (ctx) => (isStrict(ctx) ? strictLimit : generalLimit),
        generateKey: (ctx, trackerIp, name) =>
          isStrict(ctx) ? `auth:${trackerIp}:${name}` : `${ctx.getClass().name}.${ctx.getHandler().name}:${trackerIp}:${name}`,
      },
    ],
  };
}
