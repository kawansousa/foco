import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createGoalSchema,
  goalStatusSchema,
  isoDateSchema,
  updateGoalSchema,
  type CreateGoalInput,
  type EarnedTrophy,
  type GoalDetail,
  type GoalStatus,
  type GoalWithProgress,
  type ISODate,
  type UpdateGoalInput,
} from "@foco/shared";
import { z } from "zod";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { DateQueryPipe } from "../common/pipes/iso-date.pipe";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { GoalsService } from "./goals.service";

const statusQuerySchema = goalStatusSchema.optional();
const completeBodySchema = z.object({ date: isoDateSchema.optional() }).default({});

@Controller("goals")
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  /** `?date=` é o "hoje" do cliente; `?status=` filtra por active | done | archived. */
  @Get()
  async list(
    @CurrentUser() userId: string,
    @Query("date", DateQueryPipe) date: ISODate,
    @Query("status", new ZodValidationPipe(statusQuerySchema)) status?: GoalStatus,
  ): Promise<{ goals: GoalWithProgress[] }> {
    return { goals: await this.goals.listWithProgress(userId, date, status) };
  }

  @Post()
  create(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(createGoalSchema)) input: CreateGoalInput,
  ): Promise<GoalWithProgress> {
    return this.goals.create(userId, input);
  }

  @Get(":id")
  detail(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Query("date", DateQueryPipe) date: ISODate,
  ): Promise<GoalDetail> {
    return this.goals.detail(userId, id, date);
  }

  @Patch(":id")
  update(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateGoalSchema)) input: UpdateGoalInput,
  ): Promise<GoalWithProgress> {
    return this.goals.update(userId, id, input);
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  complete(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(completeBodySchema)) body: { date?: ISODate },
  ): Promise<{ goal: GoalWithProgress; newTrophies: EarnedTrophy[] }> {
    return this.goals.complete(userId, id, body.date);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() userId: string, @Param("id") id: string): Promise<void> {
    return this.goals.remove(userId, id);
  }
}
