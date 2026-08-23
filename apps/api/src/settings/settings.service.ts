import { Injectable } from "@nestjs/common";
import type { Settings, UpdateSettingsInput } from "@foco/shared";
import { serializeRestDays, toSettings } from "../common/mappers";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Configurações do Fô; cria a linha com os padrões se ainda não existir. */
  async get(userId: string): Promise<Settings> {
    const row = await this.prisma.settings.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    return toSettings(row);
  }

  /** Atualização parcial: só os campos enviados mudam. */
  async update(userId: string, input: UpdateSettingsInput): Promise<Settings> {
    const data = {
      ...(input.reminderTime !== undefined && { reminderTime: input.reminderTime }),
      ...(input.middayTime !== undefined && { middayTime: input.middayTime }),
      ...(input.streakAlertTime !== undefined && { streakAlertTime: input.streakAlertTime }),
      ...(input.tone !== undefined && { tone: input.tone }),
      ...(input.celebrateTrophies !== undefined && { celebrateTrophies: input.celebrateTrophies }),
      ...(input.quietOnRestDays !== undefined && { quietOnRestDays: input.quietOnRestDays }),
      ...(input.restDays !== undefined && { restDays: serializeRestDays(input.restDays) }),
    };
    const row = await this.prisma.settings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return toSettings(row);
  }
}
