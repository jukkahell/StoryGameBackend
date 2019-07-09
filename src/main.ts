import { NestFactory } from "@nestjs/core";
import { ConfigService } from "./config/config.service";
import { HttpService } from "@nestjs/common";
import { LoggerService, LoggerInterceptor } from "nest-logger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config: ConfigService = app.get<ConfigService>(ConfigService);
  const logger: LoggerService = app.get<LoggerService>(LoggerService);
  const httpService: HttpService = app.get<HttpService>(HttpService);

  app.useGlobalInterceptors(
    new LoggerInterceptor(logger, httpService),
  );

  const types = require("pg").types;
  types.setTypeParser(1700, parseFloat);

  await app.listen(config.appPort);
  logger.info(`App running at port ${config.appPort}`, "Main");
}
bootstrap();
