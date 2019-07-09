import { Module, HttpModule } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { ConfigModule } from "../config/config.module";
import { DBModule } from "../db/db.module";
import { PasswordService } from "./password.service";

@Module({
  imports: [ConfigModule, HttpModule, DBModule],
  controllers: [UserController],
  providers: [UserService, PasswordService],
  exports: [UserService],
})
export class UserModule {}
