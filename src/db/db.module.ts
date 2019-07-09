import { Module } from "@nestjs/common";
import { DBService } from "./db.service";
import { ConfigModule } from "../config/config.module";

@Module({
  imports: [ConfigModule],
  providers: [DBService],
  exports: [DBService],
})
export class DBModule {}
