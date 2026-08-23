import { Controller, Get, Query } from "@nestjs/common";
import type { FoMessage, ISODate, StatsResponse, TodayResponse } from "@foco/shared";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { DateQueryPipe } from "../common/pipes/iso-date.pipe";
import { ProgressService } from "./progress.service";

/** Leituras compostas do dia: `/today`, `/fo/schedule` e `/stats`. */
@Controller()
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get("today")
  today(@CurrentUser() userId: string, @Query("date", DateQueryPipe) date: ISODate): Promise<TodayResponse> {
    return this.progress.today(userId, date);
  }

  @Get("fo/schedule")
  async foSchedule(
    @CurrentUser() userId: string,
    @Query("date", DateQueryPipe) date: ISODate,
  ): Promise<{ date: ISODate; messages: FoMessage[] }> {
    return { date, messages: await this.progress.foSchedule(userId, date) };
  }

  @Get("stats")
  stats(@CurrentUser() userId: string, @Query("date", DateQueryPipe) date: ISODate): Promise<StatsResponse> {
    return this.progress.stats(userId, date);
  }
}
