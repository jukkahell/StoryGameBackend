import { sign } from "jsonwebtoken";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { JwtPayload, JwtToken } from "./auth.interface";
import { ConfigService } from "../config/config.service";
import { LoggerService } from "nest-logger";
import { User } from "../user/user.interface";

@Injectable()
export class AuthService {

  constructor(
    private readonly userService: UserService,
    private readonly config: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  public async logIn(username: string, password: string): Promise<User> {
    this.logger.info(`Logging in user ${username}...`, AuthService.name);
    const user = await this.userService.login(username, password);
    if (user) {
      return user;
    } else {
      throw new UnauthorizedException("Unauthorized", "Invalid username or password.");
    }
  }

  public async verify(payload: JwtPayload): Promise<User> {
    const user = await this.userService.getUser(payload.sub);
    if (user) {
      return user;
    }
    throw new UnauthorizedException("Invalid Authorization", "Unable to find given user.");
  }

  public async createToken(signedUser: User): Promise<JwtToken> {
    const expiresIn = this.config.jwtExpires;
    const secretOrKey = this.config.jwtSecret;
    const user: JwtPayload = {
      sub: signedUser.id,
      username: signedUser.username,
    };
    return {
      expires_in: expiresIn,
      access_token: await sign(user, secretOrKey, { expiresIn }),
    };
  }

}