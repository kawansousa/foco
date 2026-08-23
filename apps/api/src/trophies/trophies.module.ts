import { Module } from "@nestjs/common";
import { TrophiesController } from "./trophies.controller";
import { TrophiesService } from "./trophies.service";

@Module({
  controllers: [TrophiesController],
  providers: [TrophiesService],
  exports: [TrophiesService],
})
export class TrophiesModule {}
