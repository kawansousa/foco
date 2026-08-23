import { Injectable, NotFoundException } from "@nestjs/common";
import type { User } from "@foco/shared";
import { toUser } from "../common/mappers";
import type { User as UserRow } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<UserRow | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  /** Usuário público (sem hash de senha). 404 se o token apontar para alguém apagado. */
  async getById(userId: string): Promise<User> {
    const row = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!row) throw new NotFoundException("Usuário não encontrado.");
    return toUser(row);
  }

  /** Cria o usuário já com a linha de configurações padrão. */
  async create(input: { name: string; email: string; passwordHash: string }): Promise<User> {
    const row = await this.prisma.user.create({
      data: { ...input, settings: { create: {} } },
    });
    return toUser(row);
  }
}
