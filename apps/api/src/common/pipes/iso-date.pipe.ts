import { type ArgumentMetadata, BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";
import { isISODate, type ISODate } from "@foco/shared";
import { Clock } from "../clock/clock";

/**
 * Query param de data (`?date=YYYY-MM-DD`). Quando ausente, usa a data de hoje
 * do servidor — o cliente deve sempre mandar a dele, pois "hoje" é no fuso local.
 */
@Injectable()
export class DateQueryPipe implements PipeTransform<unknown, ISODate> {
  constructor(private readonly clock: Clock) {}

  transform(value: unknown, meta: ArgumentMetadata): ISODate {
    if (value === undefined || value === "") return this.clock.todayISO();
    if (typeof value !== "string" || !isISODate(value)) {
      throw new BadRequestException({ error: `Parâmetro ${meta.data ?? "date"} inválido (YYYY-MM-DD).` });
    }
    return value;
  }
}

/** Query param de data opcional (`?from=`, `?to=`): valida o formato, sem default. */
@Injectable()
export class OptionalDateQueryPipe implements PipeTransform<unknown, ISODate | undefined> {
  transform(value: unknown, meta: ArgumentMetadata): ISODate | undefined {
    if (value === undefined || value === "") return undefined;
    if (typeof value !== "string" || !isISODate(value)) {
      throw new BadRequestException({ error: `Parâmetro ${meta.data ?? "date"} inválido (YYYY-MM-DD).` });
    }
    return value;
  }
}
