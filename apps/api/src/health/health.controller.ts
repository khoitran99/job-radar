import { Controller, Get, HttpCode, HttpStatus, Res } from "@nestjs/common";
import type { Response } from "express";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // Liveness: is the process up? Used by orchestrators (k8s liveness probe)
  // to decide whether to restart the container. Must NOT depend on downstreams.
  @Get("live")
  @HttpCode(HttpStatus.OK)
  live() {
    return this.healthService.liveness();
  }

  // Readiness: are all downstreams reachable? Used to decide whether to route
  // traffic to this instance. Returns 503 if any downstream is down.
  @Get("ready")
  async ready(@Res({ passthrough: true }) res: Response) {
    const result = await this.healthService.readiness();
    if (result.status !== "ok") res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
