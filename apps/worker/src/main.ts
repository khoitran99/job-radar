import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { getConfig } from "@jobradar/config";
import { AppModule } from "./app.module";

// The worker process is a NestJS app whose only HTTP surface is /health probes.
// Real consumer logic (RabbitMQ subscribers) lands in Phase 3.

async function bootstrap() {
  const config = getConfig();
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn", "error", "debug"],
  });
  app.enableShutdownHooks();
  await app.listen(config.WORKER_HEALTH_PORT, config.API_HOST);
  Logger.log(`Worker health probe on http://${config.API_HOST}:${config.WORKER_HEALTH_PORT}`, "Bootstrap");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal bootstrap error", err);
  process.exit(1);
});
