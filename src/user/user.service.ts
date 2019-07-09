import {
  Injectable, InternalServerErrorException, NotFoundException, BadRequestException, ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { LoggerService } from "nest-logger";
import { User } from "./user.interface";
import { DBService } from "../db/db.service";
import * as uuid from "uuid";
import { QueryResult } from "pg";
import { PasswordService } from "./password.service";
import { GameUser } from "../game/game.interface";

@Injectable()
export class UserService {

  constructor(private readonly logger: LoggerService, private readonly db: DBService, private readonly passwordService: PasswordService) {}

  async getUser(id: string): Promise<User> {
    try {
      const query = "SELECT * FROM users WHERE id = $1";
      const result = await this.db.query(query, [id]);
      if (result.rowCount === 1) {
        const user: User = result.rows[0];
        delete user.password;
        return user;
      }
    } catch (err) {
      this.logger.error(`Unable to fetch user ${id} from DB`, err.stack, UserService.name);
      throw new InternalServerErrorException(
        `Unable to fetch user from DB.`,
        "DATABASE_ERROR",
      );
    }

    throw new NotFoundException(`User with id ${id} not found`, "NOT_FOUND");
  }

  async findByUsername(username: string): Promise<User> {
    try {
      const query = "SELECT * FROM users WHERE LOWER(username) = LOWER($1)";
      const result = await this.db.query(query, [username]);
      if (result.rowCount === 1) {
        const user: User = result.rows[0];
        delete user.password;
        return user;
      } else {
        return null;
      }
    } catch (err) {
      this.logger.error(`Unable to fetch user ${username} from DB`, err.stack, UserService.name);
      throw new InternalServerErrorException(
        `Unable to fetch user from DB.`,
        "DATABASE_ERROR",
      );
    }
  }

  async getUsers(gameId: string): Promise<GameUser[]> {
    try {
      const query = "SELECT u.*, ug.position FROM users u JOIN user_games ug ON u.id = ug.user_id WHERE ug.game_id = $1 ORDER BY position ASC";
      const result = await this.db.query(query, [gameId]);
      if (result.rowCount > 0) {
        const users: GameUser[] = result.rows;
        return users.map(({ password, ...user }) => user);
      } else {
        return [];
      }
    } catch (err) {
      this.logger.error(`Unable to fetch users for game ${gameId} from DB`, err, UserService.name);
      throw new InternalServerErrorException(
        `Unable to fetch users for game ${gameId} from DB.`,
        "DATABASE_ERROR",
      );
    }
  }

  async login(username: string, password: string): Promise<User> {
    const query = "SELECT * FROM users WHERE LOWER(username) = LOWER($1)";
    let result: QueryResult;
    try {
      result = await this.db.query(query, [username]);
    } catch (err) {
      this.logger.error(`Unable to login user ${username}`, err.stack, UserService.name);
      throw new InternalServerErrorException(`Unable to verify user during login.`, "DATABASE_ERROR");
    }
    if (result.rowCount === 1) {
      const user: User = result.rows[0];
      const passwordsMatch = await this.passwordService.compare(password, user.password);
      if (passwordsMatch) {
        this.logger.log(`User ${user.id} logged in with username ${username}`, UserService.name);
        delete user.password;
        return user;
      }
    }

    this.logger.info(`Failed login attempt for user ${username}`, UserService.name);
    throw new UnauthorizedException("Username or password was incorrect", "UNAUTHORIZED");
  }

  async create(user: User): Promise<User> {
    if (!user.password) {
      throw new BadRequestException(`Username must be set`, "INVALID_USERNAME");
    }
    if (user.password.length < 8) {
      throw new BadRequestException(`Password must be at least 8 characters long`, "INVALID_PASSWORD");
    }
    const existing = await this.findByUsername(user.username);
    if (existing) {
      throw new ForbiddenException(`Username already exists`, "USERNAME_EXISTS");
    }
    user.id = uuid();
    user.password = await this.passwordService.encrypt(user.password);
    const query = "INSERT INTO users (id, username, password, locale) VALUES($1, $2, $3, $4) RETURNING *";
    let result: QueryResult;
    try {
      result = await this.db.query(query, [user.id, user.username, user.password, user.locale]);
    } catch (err) {
      this.logger.error(`Unable to create user`, err.stack, UserService.name);
      throw new InternalServerErrorException(
        `Unable create user.`,
        "DATABASE_ERROR",
      );
    }
    if (result.rowCount > 0) {
      this.logger.log(`Successfully created user with id ${user.id}`, UserService.name);
      const createdUser: User = result.rows[0];
      delete createdUser.password;
      return createdUser;
    } else {
      this.logger.error(`Unable to create user. No ID returned.`, JSON.stringify(user), UserService.name);
      throw new InternalServerErrorException(
        `Unable create user.`,
        "DATABASE_ERROR",
      );
    }
  }

  async updateFcmToken(userId: string, token: string) {
    const query = "UPDATE users SET fcm_token = $1 WHERE id = $2";
    await this.db.query(query, [token, userId]);
  }

  async delete(id: string) {
    this.logger.info(`Removing user ${id}...`, UserService.name);

    const query = "DELETE FROM users WHERE id = $1";
    try {
      const result = await this.db.query(query, [id]);
      if (result.rowCount > 0) {
        this.logger.log(`Successfully removed user with id ${id}`, UserService.name);
        return true;
      } else {
        this.logger.error(`Unable to remove user...`, UserService.name);
        return false;
      }
    } catch (err) {
      this.logger.error(`Unable to delete user with id ${id}`, err.stack, UserService.name);
      throw new InternalServerErrorException("Unable to delete user", "DATABASE_ERROR");
    }
  }
}
