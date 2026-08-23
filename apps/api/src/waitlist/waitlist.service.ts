import { Injectable } from "@nestjs/common";
import type { WaitlistInput } from "@foco/shared";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type JoinResult = { ok: true; alreadyJoined: boolean };

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  /** Entra na lista de espera; repetir o e-mail não é erro (só avisa que já estava). */
  async join(input: WaitlistInput): Promise<JoinResult> {
    try {
      await this.prisma.waitlistEntry.create({ data: { email: input.email, source: input.source ?? "site" } });
      return { ok: true, alreadyJoined: false };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        return { ok: true, alreadyJoined: true };
      }
      throw err;
    }
  }
}
