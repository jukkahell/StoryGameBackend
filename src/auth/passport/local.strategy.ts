import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { LoggerService } from "nest-logger";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
  constructor(private readonly authService: AuthService, private readonly logger: LoggerService) {
    super({
      passReqToCallback: false,
      session: false,
    });
  }

  async validate(username: string, password: string) {
    try {
      return await this.authService.logIn(username, password);
    } catch (err) {
      throw new UnauthorizedException();
    }
  }
}