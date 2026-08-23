import { Module } from "@nestjs/common";
import { GoalsModule } from "../goals/goals.module";
import { SettingsModule } from "../settings/settings.module";
import { TrophiesModule } from "../trophies/trophies.module";
import { UsersModule } from "../users/users.module";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";

@Module({
  imports: [GoalsModule, SettingsModule, UsersModule, TrophiesModule],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
