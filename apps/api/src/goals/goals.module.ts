import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module";
import { TrophiesModule } from "../trophies/trophies.module";
import { GoalsController } from "./goals.controller";
import { GoalsService } from "./goals.service";

@Module({
  imports: [SettingsModule, TrophiesModule],
  controllers: [GoalsController],
  providers: [GoalsService],
  exports: [GoalsService],
})
export class GoalsModule {}
