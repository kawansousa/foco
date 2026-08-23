import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { upsertCheckinSchema, type Checkin, type CheckinResponse, type ISODate, type UpsertCheckinInput } from "@foco/shared";
import { z } from "zod";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { OptionalDateQueryPipe } from "../common/pipes/iso-date.pipe";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { CheckinsService } from "./checkins.service";

const goalIdQuerySchema = z.string().optional();

@Controller("checkins")
export class CheckinsController {
  constructor(private readonly checkins: CheckinsService) {}

  /** Idempotente: PUT cria ou atualiza o check-in de (meta, dia). */
  @Put()
  upsert(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(upsertCheckinSchema)) input: UpsertCheckinInput,
  ): Promise<CheckinResponse> {
    return this.checkins.upsert(userId, input);
  }

  @Get()
  async history(
    @CurrentUser() userId: string,
    @Query("from", OptionalDateQueryPipe) from?: ISODate,
    @Query("to", OptionalDateQueryPipe) to?: ISODate,
    @Query("goalId", new ZodValidationPipe(goalIdQuerySchema)) goalId?: string,
  ): Promise<{ checkins: Checkin[] }> {
    return { checkins: await this.checkins.list(userId, { from, to, goalId: goalId || undefined }) };
  }
}
