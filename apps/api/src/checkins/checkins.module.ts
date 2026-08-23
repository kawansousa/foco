import { Module } from "@nestjs/common";
import { GoalsModule } from "../goals/goals.module";
import { ProgressModule } from "../progress/progress.module";
import { SettingsModule } from "../settings/settings.module";
import { TrophiesModule } from "../trophies/trophies.module";
import { CheckinsController } from "./checkins.controller";
import { CheckinsService } from "./checkins.service";

@Module({
  imports: [GoalsModule, SettingsModule, TrophiesModule, ProgressModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
