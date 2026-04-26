import { Controller, Get, HttpCode, HttpStatus, Res } from "@nestjs/common";
import type { Response } from "express";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get("live")
  @HttpCode(HttpStatus.OK)
  live() {
    return this.healthService.liveness();
  }

  @Get("ready")
  async ready(@Res({ passthrough: true }) res: Response) {
    const result = await this.healthService.readiness();
    if (result.status !== "ok") res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
