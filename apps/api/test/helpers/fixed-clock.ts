import { Clock } from "../../src/common/clock/clock";

/** Relógio controlável pelos testes. O default é um instante fixo, longe de virada de dia. */
export class FixedClock extends Clock {
  constructor(private current = new Date("2026-03-10T12:00:00.000Z")) {
    super();
  }

  override now(): Date {
    return new Date(this.current);
  }

  set(iso: string): void {
    this.current = new Date(iso);
  }
}
