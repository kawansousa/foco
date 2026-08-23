import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  loginSchema,
  registerSchema,
  type AuthResponse,
  type LoginInput,
  type MeResponse,
  type RegisterInput,
} from "@foco/shared";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { Public } from "../common/auth/public.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("auth/register")
  register(@Body(new ZodValidationPipe(registerSchema)) input: RegisterInput): Promise<AuthResponse> {
    return this.auth.register(input);
  }

  @Public()
  @Post("auth/login")
  @HttpCode(HttpStatus.OK)
  login(@Body(new ZodValidationPipe(loginSchema)) input: LoginInput): Promise<AuthResponse> {
    return this.auth.login(input);
  }

  @Get("me")
  me(@CurrentUser() userId: string): Promise<MeResponse> {
    return this.auth.me(userId);
  }
}
