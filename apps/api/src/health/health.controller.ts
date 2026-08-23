import { Controller, Get } from "@nestjs/common";
import { Public } from "../common/auth/public.decorator";
import { Clock } from "../common/clock/clock";

@Public()
@Controller()
export class HealthController {
  constructor(private readonly clock: Clock) {}

  @Get()
  root() {
    return { name: "Foco API", docs: "/health" };
  }

  @Get("health")
  health(): { ok: true; time: string } {
    return { ok: true, time: this.clock.now().toISOString() };
  }
}
