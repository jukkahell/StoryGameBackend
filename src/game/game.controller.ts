import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Delete, Put, UseGuards, Headers } from "@nestjs/common";
import { GameService } from "./game.service";
import { Game } from "./game.interface";
import { AuthGuard } from "@nestjs/passport";
import { LoggedInUser } from "../auth/auth.decorator";
import { User } from "../user/user.interface";

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get("/games")
  @UseGuards(AuthGuard("jwt"))
  async getGames(@LoggedInUser() user: User) {
    return await this.gameService.getOngoingGames(user.id);
  }

  @Get("/finishedGames")
  @UseGuards(AuthGuard("jwt"))
  async getFinishedGames(@LoggedInUser() user: User) {
    return await this.gameService.getFinishedGames(user.id);
  }

  @Get("/game/:id")
  @UseGuards(AuthGuard("jwt"))
  async getGame(@Param("id") id: string) {
    return await this.gameService.getGame(id);
  }

  @Post("/game")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard("jwt"))
  async createGame(@LoggedInUser() user: User, @Body() game: Game) {
    const created = await this.gameService.create(game, user);
    await this.gameService.join(created.id, user.id);
    created.users.push(user);
    return created;
  }

  @Delete("/game/:id")
  @UseGuards(AuthGuard("jwt"))
  async deleteGame(@LoggedInUser() user: User, @Param("id") id: string) {
    return await this.gameService.delete(id, user.id);
  }

  @Put("/game/:gameId/join")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthGuard("jwt"))
  async join(@LoggedInUser() user: User, @Param("gameId") gameId: string) {
    return await this.gameService.join(gameId, user.id);
  }

  @Put("/game/:gameId/start")
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthGuard("jwt"))
  async start(@LoggedInUser() user: User, @Param("gameId") gameId: string) {
    return await this.gameService.start(gameId, user.id);
  }
}