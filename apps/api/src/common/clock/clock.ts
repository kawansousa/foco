import { Injectable } from "@nestjs/common";
import { todayISO, type ISODate } from "@foco/shared";

/**
 * Fonte única de "agora" da aplicação. Injetável para que regras que dependem
 * da data (ex.: "não dá pra registrar no futuro") sejam testáveis com tempo fixo.
 */
@Injectable()
export class Clock {
  now(): Date {
    return new Date();
  }

  /** Data de hoje no fuso do servidor (`YYYY-MM-DD`). */
  todayISO(): ISODate {
    return todayISO(this.now());
  }
}
