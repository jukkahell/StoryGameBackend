import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Delete, UseGuards, UnauthorizedException, Put } from "@nestjs/common";
import { UserService } from "./user.service";
import { User, Fcm } from "./user.interface";
import { AuthGuard } from "@nestjs/passport";
import { LoggedInUser } from "../auth/auth.decorator";

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("/users/:gameId")
  @UseGuards(AuthGuard("jwt"))
  async getUsers(@Param("gameId") gameId: string) {
    return await this.userService.getUsers(gameId);
  }

  @Get("/user/:id")
  async getUser(@Param("id") id: string) {
    return await this.userService.getUser(id);
  }

  @Get("/me")
  @UseGuards(AuthGuard("jwt"))
  async getMe(@LoggedInUser() user: User) {
    return await this.userService.getUser(user.id);
  }

  @Post("/user")
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() user: User) {
    return await this.userService.create(user);
  }

  @Put("/user/fcmToken")
  @UseGuards(AuthGuard("jwt"))
  async updateFcmToken(@LoggedInUser() user: User, @Body() fcm: Fcm) {
    return await this.userService.updateFcmToken(user.id, fcm.token);
  }

  @Delete("/user/:id")
  @UseGuards(AuthGuard("jwt"))
  async deleteUser(@LoggedInUser() user: User, @Param("id") id: string) {
    if (user.id !== id) {
      throw new UnauthorizedException(`Not permitted to do this`, "NOT_PERMITTED");
    }
    return await this.userService.delete(id);
  }
}
