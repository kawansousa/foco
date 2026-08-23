import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { diffDays, type FoMessage, type ISODate, type StatsResponse, type TodayResponse } from "@foco/shared";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { DateQueryPipe, OptionalDateQueryPipe } from "../common/pipes/iso-date.pipe";
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

  /** `from` opcional define o início da janela (máx. 366 dias até `date`); padrão: 30 dias. */
  @Get("stats")
  stats(
    @CurrentUser() userId: string,
    @Query("date", DateQueryPipe) date: ISODate,
    @Query("from", OptionalDateQueryPipe) from?: ISODate,
  ): Promise<StatsResponse> {
    if (from && (from > date || diffDays(from, date) > 365)) {
      throw new BadRequestException({ error: "Período inválido: `from` deve ser até `date`, no máximo 366 dias." });
    }
    return this.progress.stats(userId, date, from);
  }
}
