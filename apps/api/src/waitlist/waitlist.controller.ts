import { Body, Controller, HttpStatus, Post, Res } from "@nestjs/common";
import type { Response } from "express";
import { waitlistSchema, type WaitlistInput } from "@foco/shared";
import { Public } from "../common/auth/public.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { WaitlistService } from "./waitlist.service";

/** Rota pública usada pelo site. */
@Public()
@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  /** 201 quando entrou agora; 200 quando o e-mail já estava na lista. */
  @Post()
  async join(
    @Body(new ZodValidationPipe(waitlistSchema)) input: WaitlistInput,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.waitlist.join(input);
    res.status(result.alreadyJoined ? HttpStatus.OK : HttpStatus.CREATED);
    return result;
  }
}
