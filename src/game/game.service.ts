import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { LoggerService } from "nest-logger";
import { Game, GameDBO, GameStatus } from "./game.interface";
import { DBService } from "../db/db.service";
import * as uuid from "uuid";
import { QueryResult } from "pg";
import { UserService } from "../user/user.service";
import { User } from "../user/user.interface";
import { Story } from "../story/story.interface";
import { NotificationService } from "../firebase/notification.service";
import admin from "firebase-admin";
import { NotificationType } from "../firebase/notification.interface";

@Injectable()
export class GameService {

  constructor(
    private readonly logger: LoggerService,
    private readonly db: DBService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  async getGame(id: string): Promise<Game> {
    try {
      const query = "SELECT * FROM games WHERE id = $1";
      const result = await this.db.query(query, [id]);
      if (result.rowCount === 1) {
        const gameDBO: GameDBO = result.rows[0];
        const game = this.mapGame(gameDBO);
        return game;
      } else {
        throw new NotFoundException(`Game with id ${id} not found`, "NOT_FOUND");
      }
    } catch (err) {
      this.logger.error(`Unable to fetch game ${id} from DB`, err.stack, GameService.name);
      throw new InternalServerErrorException(
        `Unable to fetch game from DB.`,
        "DATABASE_ERROR",
      );
    }
  }

  async getOngoingGames(userId: string): Promise<Game[]> {
    return await this.getGames(userId, ["created", "started"]);
  }

  async getFinishedGames(userId: string): Promise<Game[]> {
    return await this.getGames(userId, ["finished"]);
  }

  async getGames(userId: string, statuses: GameStatus[]): Promise<Game[]> {
    try {
      const query = "SELECT g.* FROM games g JOIN user_games ug ON g.id = ug.game_id WHERE ug.user_id = $1 AND g.status = ANY($2)";
      const result = await this.db.query(query, [userId, statuses]);
      if (result.rowCount > 0) {
        const games: GameDBO[] = result.rows;
        return Promise.all(games.map(g => this.mapGame(g)));
      } else {
        return [];
      }
    } catch (err) {
      this.logger.error(`Unable to fetch games for user ${userId} from DB`, err, GameService.name);
      throw new InternalServerErrorException(
        `Unable to fetch games for user ${userId} from DB.`,
        "DATABASE_ERROR",
      );
    }
  }

  async getStories(gameId: string): Promise<Story[]> {
    try {
      const query = "SELECT * FROM stories WHERE game = $1 ORDER BY id ASC";
      const result = await this.db.query(query, [gameId]);
      if (result.rowCount > 0) {
        return result.rows;
      } else {
        return [];
      }
    } catch (err) {
      this.logger.error(`Unable to fetch stories for game ${gameId} from DB`, err, GameService.name);
      throw new InternalServerErrorException(
        `Unable to fetch stories for game ${gameId} from DB.`,
        "DATABASE_ERROR",
      );
    }
  }

  async create(game: Game, user: User): Promise<Game> {
    const errors = [];
    if (game.settings.maxWords < game.settings.minWords) {
      errors.push("max_words_smaller_than_min_words");
    }
    if (!game.settings.maxWords || !Number.isInteger(game.settings.maxWords) || game.settings.maxWords < 1) {
      errors.push("max_words_invalid");
    }
    if (!game.settings.minWords || !Number.isInteger(game.settings.minWords) || game.settings.minWords < 1) {
      errors.push("min_words_invalid");
    }
    if (!game.settings.roundsPerUser || !Number.isInteger(game.settings.roundsPerUser) || game.settings.roundsPerUser < 1) {
      errors.push("rounds_per_user_invalid");
    }
    if (game.settings.wordsVisible && (!Number.isInteger(game.settings.wordsVisible) || game.settings.wordsVisible < 0)) {
      errors.push("words_visible_invalid");
    }
    if (game.settings.maxParticipants && (!Number.isInteger(game.settings.maxParticipants) || game.settings.maxParticipants < 2)) {
      errors.push("max_participants_invalid");
    }
    if (!game.settings.locale) {
      errors.push("language_must_be_selected");
    }
    if (!game.title) {
      errors.push("title_must_be_set");
    }
    if (errors.length > 0) {
      throw new BadRequestException("Validation failed", errors.join(", "));
    }

    game.id = uuid();
    const query = "INSERT INTO games (id, title, owner, settings) VALUES($1, $2, $3, $4) RETURNING *";
    let result: QueryResult;
    try {
      result = await this.db.query(query, [game.id, game.title, user.id, game.settings]);
    } catch (err) {
      this.logger.error(`Unable to create game`, err.stack, GameService.name);
      throw new InternalServerErrorException(
        `Unable create game.`,
        "DATABASE_ERROR",
      );
    }
    if (result.rowCount > 0) {
      this.logger.log(`Successfully created game with id ${game.id}`, GameService.name);
      const gameDBO: GameDBO = result.rows[0];
      return await this.mapGame(gameDBO);
    } else {
      this.logger.error(`Unable to create game. No ID returned.`, JSON.stringify(game), GameService.name);
      throw new InternalServerErrorException(
        `Unable create game.`,
        "DATABASE_ERROR",
      );
    }
  }

  async delete(id: string, userId: string) {
    this.logger.info(`Removing game ${id}...`, GameService.name);

    const query = "DELETE FROM games WHERE id = $1 AND owner = $2";
    try {
      const result = await this.db.query(query, [id, userId]);
      if (result.rowCount > 0) {
        this.logger.log(`Successfully removed game with id ${id}`, GameService.name);
        return true;
      } else {
        this.logger.error(`Unable to remove game...`, GameService.name);
        return false;
      }
    } catch (err) {
      this.logger.error(`Unable to delete game ${id}`, err.stack, GameService.name);
      throw new InternalServerErrorException("Unable to delete game", "DATABASE_ERROR");
    }
  }

  async join(gameId: string, userId: string) {
    this.logger.info(`User ${userId} joining to game ${gameId}...`, GameService.name);
    const game = await this.getGame(gameId);
    if (!game) {
      throw new NotFoundException(`Game not found with id ${gameId}`, "NOT_FOUND");
    }
    if (game.users.some(u => u.id === userId)) {
      throw new BadRequestException(`User already joined in game`, "ALREADY_JOINED");
    }
    if (game.status === "started") {
      throw new ForbiddenException(`Game already started`, "ALREADY_STARTED");
    }
    if (game.settings.maxParticipants >= 2 && game.settings.maxParticipants < game.users.length + 1) {
      throw new ForbiddenException(`Game already has maximum amount of participants.`, "GAME_IS_FULL");
    }
    const query = "INSERT INTO user_games (game_id, user_id, position) VALUES ($1, $2, $3)";
    await this.db.query(query, [gameId, userId, game.users.length]);
    this.notifyUserJoined(game, userId);
  }

  async start(gameId: string, userId: string) {
    this.logger.info(`User ${userId} starting game ${gameId}...`, GameService.name);
    const game = await this.getGame(gameId);
    if (!game) {
      throw new NotFoundException(`Game not found with id ${gameId}`, "NOT_FOUND");
    }
    if (game.owner !== userId) {
      throw new ForbiddenException(`Only owner is allowed to start the game`, "NOT_ALLOWED_TO_START");
    }
    if (game.status !== "created") {
      throw new ForbiddenException(`Game already started`, "ALREADY_STARTED");
    }
    if (game.users.length <= 1) {
      throw new ForbiddenException(`Game must have at least 2 participants`, "TOO_FEW_PARTICIPANTS");
    }
    const query = "UPDATE games SET status = $2 WHERE id = $1";
    await this.db.query(query, [gameId, "started"]);
    this.notifyStoryStarted(gameId);
  }

  private async mapGame(dbo: GameDBO): Promise<Game> {
    const game: Game = dbo;
    game.users = await this.userService.getUsers(game.id);
    game.stories = await this.getStories(game.id);
    game.nextWriter = game.stories.length === 0 ? await this.userService.getUser(game.owner) : game.users[game.stories.length % game.users.length];
    return game;
  }

  private async notifyStoryStarted(gameId: string) {
    // Get game again to get the correct nextWriter
    const game = await this.getGame(gameId);
    const payload: admin.messaging.MessagingPayload = {
      notification: {
        title: game.title,
        body: "Story started, get ready!",
      },
      data: {
        type: "STORY_STARTED" as NotificationType,
        gameId: game.id,
        nextWriter: JSON.stringify(game.nextWriter),
      },
    };

    game.users.filter(u => u.id !== game.owner && u.fcm_token).forEach(u => {
      this.notificationService.sendNotification(u.fcm_token, payload);
    });
  }

  private async notifyUserJoined(game: Game, userId: string) {
    // Get game again to get the correct nextWriter
    const user = await this.userService.getUser(userId);
    const payload: admin.messaging.MessagingPayload = {
      notification: {
        title: game.title,
        body: `${user.username} joined`,
      },
      data: {
        type: "USER_JOINED" as NotificationType,
        gameId: game.id,
        participants: String(game.users.length + 1),
      },
    };

    const owner = game.users.find(u => u.id === game.owner);
    if (owner.fcm_token) {
      this.notificationService.sendNotification(owner.fcm_token, payload);
    }
  }
}
