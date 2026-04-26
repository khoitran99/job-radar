import { Injectable } from "@nestjs/common";
import { getConfig } from "@jobradar/config";
import type { HealthStatus } from "@jobradar/shared-types";
import * as amqp from "amqplib";

const SERVICE = "scheduler";
const startedAt = Date.now();

@Injectable()
export class HealthService {
  liveness(): HealthStatus {
    return {
      status: "ok",
      service: SERVICE,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    };
  }

  async readiness(): Promise<HealthStatus> {
    const rabbitmq = await this.checkRabbitmq();
    return {
      status: rabbitmq === "ok" ? "ok" : "degraded",
      service: SERVICE,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      checks: { rabbitmq },
    };
  }

  private async checkRabbitmq(): Promise<"ok" | "down"> {
    const config = getConfig();
    try {
      const conn = await amqp.connect(config.RABBITMQ_URL, { timeout: 2000 });
      await conn.close();
      return "ok";
    } catch {
      return "down";
    }
  }
}
