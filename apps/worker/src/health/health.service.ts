import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { getConfig } from "@jobradar/config";
import type { HealthStatus } from "@jobradar/shared-types";
import * as amqp from "amqplib";
import { MongoClient } from "mongodb";

const SERVICE = "worker";
const startedAt = Date.now();

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private mongo: MongoClient | undefined;

  async onModuleDestroy() {
    await this.mongo?.close();
  }

  liveness(): HealthStatus {
    return {
      status: "ok",
      service: SERVICE,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    };
  }

  async readiness(): Promise<HealthStatus> {
    const [rabbitmq, mongo] = await Promise.all([this.checkRabbitmq(), this.checkMongo()]);
    const checks = { rabbitmq, mongo };
    const allOk = Object.values(checks).every((c) => c === "ok");
    return {
      status: allOk ? "ok" : "degraded",
      service: SERVICE,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      checks,
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

  private async checkMongo(): Promise<"ok" | "down"> {
    const config = getConfig();
    try {
      this.mongo ??= new MongoClient(config.MONGO_URL, { serverSelectionTimeoutMS: 2000 });
      await this.mongo.db().command({ ping: 1 });
      return "ok";
    } catch {
      return "down";
    }
  }
}
