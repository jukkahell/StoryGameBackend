import { UseGuards, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoggedInUser } from "./auth.decorator";
import { AuthGuard } from "@nestjs/passport";

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard("local"))
  @Post("/login")
  public async login(@LoggedInUser() user) {
    const token = await this.authService.createToken(user);
    return { token, user, newUser: false };
  }
}