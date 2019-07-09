import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Headers, Get } from "@nestjs/common";
import { StoryService } from "./story.service";
import { AuthGuard } from "@nestjs/passport";
import { LoggedInUser } from "../auth/auth.decorator";
import { User } from "../user/user.interface";
import { Story } from "./story.interface";

@Controller()
export class StoryController {
  constructor(private readonly storyService: StoryService) {}

  @Post("/story")
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard("jwt"))
  async createStory(@LoggedInUser() user: User, @Headers("game-id") gameId: string, @Body() story: Story) {
    return await this.storyService.create(story, user, gameId);
  }

  @Get("/story")
  @UseGuards(AuthGuard("jwt"))
  async getPrevious(@LoggedInUser() user: User, @Headers("game-id") gameId: string) {
    return await this.storyService.getPrevious(gameId, user);
  }

  @Get("/allStories")
  @UseGuards(AuthGuard("jwt"))
  async getAll(@LoggedInUser() user: User, @Headers("game-id") gameId: string) {
    return await this.storyService.getStories(gameId, user);
  }
}