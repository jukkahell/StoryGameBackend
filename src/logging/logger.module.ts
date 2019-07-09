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
        return new LoggerService(config.logLevel, config.serviceName, config.logAppenders, config.logFilePath);
      },
      inject: [ConfigService],
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
