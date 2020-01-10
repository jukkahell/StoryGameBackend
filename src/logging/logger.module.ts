import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { LoggerService } from "nest-logger";
import { ConfigService } from "../config/config.service";

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LoggerService,
      useFactory: (config: ConfigService) => {
        const loggers = [
          LoggerService.console({ serviceName: config.serviceName, colorize: true }),
          LoggerService.rotate({ serviceName: config.serviceName, path: config.logFilePath }),
        ];
        return new LoggerService(
          config.logLevel,
          loggers,
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
