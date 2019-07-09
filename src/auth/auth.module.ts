import { AuthService } from "./auth.service";
import { JwtStrategy } from "./passport/jwt.strategy";
import { LocalStrategy } from "./passport/local.strategy";
import { UserModule } from "../user/user.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { LoggerModule } from "../logging/logger.module";
import { AuthController } from "./auth.controller";

@Module({
  imports: [UserModule, ConfigModule, LoggerModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
})
export class AuthModule { }