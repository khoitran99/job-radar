import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { getConfig } from "@jobradar/config";
import { getPrisma, type PrismaClient } from "@jobradar/db";
import type { HealthStatus } from "@jobradar/shared-types";
import Redis from "ioredis";
import { MongoClient } from "mongodb";
import * as amqp from "amqplib";

const SERVICE = "api";
const startedAt = Date.now();

@Injectable()
export class HealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private prisma!: PrismaClient;
  private redis!: Redis;
  private mongo!: MongoClient;

  async onModuleInit() {
    const config = getConfig();
    this.prisma = getPrisma();
    this.redis = new Redis(config.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
    this.mongo = new MongoClient(config.MONGO_URL, { serverSelectionTimeoutMS: 2000 });
    try {
      await this.redis.connect();
    } catch (err) {
      this.logger.warn(`Redis lazy connect failed (will retry on demand): ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await Promise.allSettled([
      this.prisma?.$disconnect(),
      this.redis?.quit(),
      this.mongo?.close(),
    ]);
  }

  liveness(): HealthStatus {
    return {
      status: "ok",
      service: SERVICE,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    };
  }

  async readiness(): Promise<HealthStatus> {
    const [postgres, redis, rabbitmq, mongo] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
      this.checkRabbitmq(),
      this.checkMongo(),
    ]);
    const checks = { postgres, redis, rabbitmq, mongo };
    const allOk = Object.values(checks).every((c) => c === "ok");
    return {
      status: allOk ? "ok" : "degraded",
      service: SERVICE,
      uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
      checks,
    };
  }

  private async checkPostgres(): Promise<"ok" | "down"> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return "ok";
    } catch {
      return "down";
    }
  }

  private async checkRedis(): Promise<"ok" | "down"> {
    try {
      const pong = await this.redis.ping();
      return pong === "PONG" ? "ok" : "down";
    } catch {
      return "down";
    }
  }

  private async checkRabbitmq(): Promise<"ok" | "down"> {
    // Open and close a short-lived connection. In Phase 3 we'll keep a pool open.
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
    try {
      await this.mongo.db().command({ ping: 1 });
      return "ok";
    } catch {
      return "down";
    }
  }
}
