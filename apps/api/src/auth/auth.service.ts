import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthResponse, LoginInput, MeResponse, RegisterInput, UpdateMeInput } from "@foco/shared";
import { toUser } from "../common/mappers";
import { SettingsService } from "../settings/settings.service";
import { TrophiesService } from "../trophies/trophies.service";
import { UsersService } from "../users/users.service";
import { PasswordService } from "./password.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly settings: SettingsService,
    private readonly passwords: PasswordService,
    private readonly trophies: TrophiesService,
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
    return { token: await this.sign(user.id, 0), user, settings: await this.settings.get(user.id), trophyCount: 0 };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const row = await this.users.findByEmail(input.email);
    // Mesma mensagem para e-mail inexistente e senha errada: não revela quem tem conta.
    if (!row || !(await this.passwords.verify(input.password, row.passwordHash))) {
      throw new UnauthorizedException("E-mail ou senha incorretos.");
    }
    const [settings, trophyCount] = await Promise.all([this.settings.get(row.id), this.trophies.countEarned(row.id)]);
    return { token: await this.sign(row.id, row.tokenVersion), user: toUser(row), settings, trophyCount };
  }

  async me(userId: string): Promise<MeResponse> {
    // Usuário primeiro: se a conta sumiu, é 404 (e não se cria settings órfã).
    const user = await this.users.getById(userId);
    const [settings, trophyCount] = await Promise.all([this.settings.get(userId), this.trophies.countEarned(userId)]);
    return { user, settings, trophyCount };
  }

  /** Atualiza nome/foto e devolve o perfil completo (mesmo formato de GET /me). */
  async updateMe(userId: string, input: UpdateMeInput): Promise<MeResponse> {
    await this.users.getById(userId); // 404 se a conta não existe mais
    await this.users.update(userId, input);
    return this.me(userId);
  }

  /**
   * "Sair de todos os dispositivos": invalida todos os tokens já emitidos e
   * devolve um token novo para quem pediu continuar logado.
   */
  async logoutAll(userId: string): Promise<{ token: string }> {
    const version = await this.users.bumpTokenVersion(userId);
    return { token: await this.sign(userId, version) };
  }

  private sign(userId: string, version: number): Promise<string> {
    return this.jwt.signAsync({ ver: version }, { subject: userId });
  }
}
