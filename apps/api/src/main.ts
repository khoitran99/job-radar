import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { getConfig } from "@jobradar/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const config = getConfig();
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "warn", "error", "debug"],
  });
  app.enableCors({ origin: true, credentials: true });
  app.enableShutdownHooks();
  await app.listen(config.API_PORT, config.API_HOST);
  Logger.log(`API listening on http://${config.API_HOST}:${config.API_PORT}`, "Bootstrap");
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal bootstrap error", err);
  process.exit(1);
});
