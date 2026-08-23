import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from "@nestjs/common";
import { StrictThrottle } from "../common/throttle";
import {
  loginSchema,
  registerSchema,
  updateMeSchema,
  type AuthResponse,
  type LoginInput,
  type MeResponse,
  type RegisterInput,
  type UpdateMeInput,
} from "@foco/shared";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Public } from "../common/auth/public.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @StrictThrottle()
  @Post("auth/register")
  register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput): Promise<AuthResponse> {
    return this.auth.register(input);
  }

  @Public()
  @StrictThrottle()
  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput): Promise<AuthResponse> {
    return this.auth.login(input);
  }

  @Post("auth/logout-all")
  @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser() userId: string): Promise<{ token: string }> {
    return this.auth.logoutAll(userId);
  }

  @Get("me")
  me(@CurrentUser() userId: string): Promise<MeResponse> {
    return this.auth.me(userId);
  }

  @Patch("me")
  updateMe(
    @CurrentUser() userId: string,
    @Body(new ZodValidationPipe(updateMeSchema)) input: UpdateMeInput,
  ): Promise<MeResponse> {
    return this.auth.updateMe(userId, input);
  }
}
