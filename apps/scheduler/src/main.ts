import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { getConfig } from "@jobradar/config";
import { AppModule } from "./app.module";

// The scheduler emits per-source fetch messages on cron. Real cron logic lands in Phase 6.
// Phase 0 just boots the process and exposes /health.

async function bootstrap() {
  const config = getConfig();
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn", "error", "debug"],
  });
  app.enableShutdownHooks();
  await app.listen(config.SCHEDULER_HEALTH_PORT, config.API_HOST);
  Logger.log(
    `Scheduler health probe on http://${config.API_HOST}:${config.SCHEDULER_HEALTH_PORT}`,
    "Bootstrap",
  );
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal bootstrap error", err);
  process.exit(1);
});
