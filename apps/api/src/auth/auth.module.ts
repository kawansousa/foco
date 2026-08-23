import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import type { Env } from "../config/env";
import { SettingsModule } from "../settings/settings.module";
import { TrophiesModule } from "../trophies/trophies.module";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";

@Module({
  imports: [
    UsersModule,
    SettingsModule,
    TrophiesModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get("jwtSecret", { infer: true }),
        signOptions: { algorithm: "HS256", expiresIn: config.get("jwtExpiresIn", { infer: true }) },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    // Guard global: toda rota exige token, exceto as marcadas com @Public()
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
