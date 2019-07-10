import { Injectable, InternalServerErrorException, BadRequestException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { LoggerService } from "nest-logger";
import { DBService } from "../db/db.service";
import { QueryResult } from "pg";
import { User } from "../user/user.interface";
import { Story } from "./story.interface";
import { GameService } from "../game/game.service";
import { NotificationService } from "../firebase/notification.service";
import admin from "firebase-admin";
import { NotificationType } from "../firebase/notification.interface";
import { Game, GameStatus } from "../game/game.interface";

@Injectable()
export class StoryService {

  constructor(
    private readonly logger: LoggerService,
    private readonly db: DBService,
    private readonly gameService: GameService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(story: Story, user: User, gameId: string): Promise<Story> {
    const game = await this.gameService.getGame(gameId);
    const pos = game.stories.length > 0 ? game.stories.length : 0;
    story.id = pos;

    if (!story.text) {
      throw new BadRequestException(`Text field can't be empty.`, "EMPTY_TEXT");
    } else if (story.text.split(" ").length < game.settings.minWords) {
      throw new BadRequestException(`Text must have at least ${game.settings.minWords} words.`, "TOO_SHORT_TEXT");
    } else if (story.text.split(" ").length > game.settings.maxWords) {
      throw new BadRequestException(`Text must not have more than ${game.settings.maxWords} words.`, "TOO_LONG_TEXT");
    } else if (game.status !== "started") {
      throw new ForbiddenException(`Game has not started yet.`, "GAME_NOT_STARTED");
    } else if (game.nextWriter.id !== user.id) {
      throw new ForbiddenException(`You are not allowed to write yet. Wait for your turn.`, "NOT_NEXT_WRITER");
    }

    const query = "INSERT INTO stories (id, game, author, text) VALUES($1, $2, $3, $4) RETURNING *";
    let result: QueryResult;
    try {
      result = await this.db.query(query, [pos, gameId, user.id, story.text]);
    } catch (err) {
      this.logger.error(`Unable to create story`, err.stack, StoryService.name);
      throw new InternalServerErrorException(
        `Unable to create story.`,
        "DATABASE_ERROR",
      );
    }
    if (result.rowCount > 0) {
      this.logger.log(`Successfully created story to position ${story.id} for game ${gameId} by author ${user.id}`, StoryService.name);
      game.stories.push(story);
      const isFinished = await this.checkIfFinished(game);
      if (!isFinished) {
        this.notifyNextWriter(game.id);
      }
      return result.rows[0];
    } else {
      this.logger.error(`Unable to create story. No ID returned.`, JSON.stringify(story), StoryService.name);
      throw new InternalServerErrorException(
        `Unable to create story.`,
        "DATABASE_ERROR",
      );
    }
  }

  async getStories(gameId: string, user: User): Promise<Story[]> {
    const game = await this.gameService.getGame(gameId);
    if (!game.users.find(u => u.id === user.id)) {
      throw new UnauthorizedException("Not permitted to access story", "UNAUTHORIZED");
    }
    return game.stories;
  }

  async getPrevious(gameId: string, user: User): Promise<string> {
    const game = await this.gameService.getGame(gameId);
    if (game.stories.length === 0) {
      return "";
    }
    if (game.nextWriter.id !== user.id) {
      throw new ForbiddenException(`You are not allowed to write yet. Wait for your turn.`, "NOT_NEXT_WRITER");
    }

    if (game.settings.wordsVisible > 0) {
      return game.stories[game.stories.length - 1].text.split(" ").splice(-game.settings.wordsVisible).join(" ");
    } else {
      return game.stories.map(s => s.text).join("\n");
    }
  }

  private async checkIfFinished(game: Game) {
    if (game.stories.length / game.users.length >= game.settings.roundsPerUser) {
      const query = "UPDATE games SET status = $2 WHERE id = $1";
      await this.db.query(query, [game.id, "finished" as GameStatus]);
      this.notifyFinish(game.id);
      return true;
    }
    return false;
  }

  private async notifyFinish(gameId: string) {
    // Get game again to get the correct nextWriter
    const game = await this.gameService.getGame(gameId);
    const payload: admin.messaging.MessagingPayload = {
      notification: {
        title: game.title,
        body: "Story finished!",
      },
      data: {
        type: "STORY_FINISHED",
        gameId: game.id,
      },
    };

    if (game.nextWriter.fcm_token) {
      this.notificationService.sendNotification(game.nextWriter.fcm_token, payload);
    }
  }

  private async notifyNextWriter(gameId: string) {
    // Get game again to get the correct nextWriter
    const game = await this.gameService.getGame(gameId);
    const payload: admin.messaging.MessagingPayload = {
      notification: {
        title: game.title,
        body: "It's your turn to write",
      },
      data: {
        type: "NEXT_WRITER" as NotificationType,
        gameId: game.id,
      },
    };

    if (game.nextWriter.fcm_token) {
      this.notificationService.sendNotification(game.nextWriter.fcm_token, payload);
    }
  }
}
