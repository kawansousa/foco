import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthResponse, LoginInput, MeResponse, RegisterInput } from "@foco/shared";
import { toUser } from "../common/mappers";
import { SettingsService } from "../settings/settings.service";
import { UsersService } from "../users/users.service";
import { PasswordService } from "./password.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly settings: SettingsService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    if (await this.users.findByEmail(input.email)) {
      throw new ConflictException("Já existe uma conta com esse e-mail.");
    }
    const user = await this.users.create({
      name: input.name,
      email: input.email,
      passwordHash: await this.passwords.hash(input.password),
    });
    return { token: await this.sign(user.id), user, settings: await this.settings.get(user.id) };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const row = await this.users.findByEmail(input.email);
    // Mesma mensagem para e-mail inexistente e senha errada: não revela quem tem conta.
    if (!row || !(await this.passwords.verify(input.password, row.passwordHash))) {
      throw new UnauthorizedException("E-mail ou senha incorretos.");
    }
    return { token: await this.sign(row.id), user: toUser(row), settings: await this.settings.get(row.id) };
  }

  async me(userId: string): Promise<MeResponse> {
    return { user: await this.users.getById(userId), settings: await this.settings.get(userId) };
  }

  private sign(userId: string): Promise<string> {
    return this.jwt.signAsync({}, { subject: userId });
  }
}
