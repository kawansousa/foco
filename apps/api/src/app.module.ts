import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_FILTER, APP_GUARD, Reflector } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { CheckinsModule } from "./checkins/checkins.module";
import { ClockModule } from "./common/clock/clock.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { throttlerOptions } from "./common/throttle";
import { API_ROOT } from "./config/database-url";
import { validateEnv } from "./config/env";
import { GoalsModule } from "./goals/goals.module";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { ProgressModule } from "./progress/progress.module";
import { SettingsModule } from "./settings/settings.module";
import { TrophiesModule } from "./trophies/trophies.module";
import { WaitlistModule } from "./waitlist/waitlist.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${API_ROOT}/.env`,
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({ inject: [ConfigService, Reflector], useFactory: throttlerOptions }),
    ClockModule,
    PrismaModule,
    AuthModule,
    SettingsModule,
    GoalsModule,
    CheckinsModule,
    TrophiesModule,
    ProgressModule,
    WaitlistModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    // Rate limit por IP (antes do guard de auth, que é registrado no AuthModule)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
