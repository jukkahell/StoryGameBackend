import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { NotificationService } from "./notification.service";

@Module({
  imports: [ConfigModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
