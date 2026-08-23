import { Body, Controller, Get, Put } from "@nestjs/common";
import { updateSettingsSchema, type Settings, type UpdateSettingsInput } from "@foco/shared";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  get(@CurrentUser() userId: string): Promise<Settings> {
    return this.settings.get(userId);
  }

  @Put()
  update(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(updateSettingsSchema)) input: UpdateSettingsInput,
  ): Promise<Settings> {
    return this.settings.update(userId, input);
  }
}
