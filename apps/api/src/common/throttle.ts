import { type ExecutionContext, SetMetadata } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import type { Reflector } from "@nestjs/core";
import type { ThrottlerModuleOptions } from "@nestjs/throttler";
import type { Env } from "../config/env";

const STRICT_THROTTLE_KEY = "strictThrottle";

/** Rota sensível (login, cadastro): limite por IP bem menor (`RATE_LIMIT_AUTH_PER_MIN`). */
export const StrictThrottle = () => SetMetadata(STRICT_THROTTLE_KEY, true);

/**
 * Um único limitador por IP, janela de 1 minuto. O limite é resolvido por
 * rota: estrito nas marcadas com `@StrictThrottle()`, folgado nas demais.
 */
export function throttlerOptions(config: ConfigService<Env, true>, reflector: Reflector): ThrottlerModuleOptions {
  const strict = config.get("rateLimitAuthPerMin", { infer: true });
  const general = config.get("rateLimitPerMin", { infer: true });
  return {
    throttlers: [
      {
        ttl: 60_000,
        limit: (ctx: ExecutionContext) =>
          reflector.getAllAndOverride<boolean>(STRICT_THROTTLE_KEY, [ctx.getHandler(), ctx.getClass()]) ? strict : general,
      },
    ],
    errorMessage: "Muitas tentativas. Aguarde um minuto e tente de novo.",
  };
}
