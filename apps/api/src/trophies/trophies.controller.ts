import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { updateTrophySchema, type EarnedTrophy, type TrophyView, type UpdateTrophyInput } from "@foco/shared";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { TrophiesService } from "./trophies.service";

@Controller("trophies")
export class TrophiesController {
  constructor(private readonly trophies: TrophiesService) {}

  @Get()
  async list(@CurrentUser() userId: string): Promise<{ trophies: TrophyView[] }> {
    return { trophies: await this.trophies.listView(userId) };
  }

  @Patch(":id")
  updateNote(
    @CurrentUser() userId: string,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateTrophySchema)) input: UpdateTrophyInput,
  ): Promise<EarnedTrophy> {
    return this.trophies.updateNote(userId, id, input.note);
  }
}
