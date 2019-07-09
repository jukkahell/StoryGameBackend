import { Pool, QueryResult } from "pg";
import { ConfigService } from "../config/config.service";
import { Injectable } from "@nestjs/common";
import { LoggerService } from "nest-logger";

@Injectable()
export class DBService {
    private readonly pool: Pool;

    constructor(config: ConfigService, logger: LoggerService) {
        this.pool = new Pool({
            user: config.dbUser,
            host: config.dbHost,
            database: config.dbDatabase,
            password: config.dbPass,
            port: config.dbPort,
        });
        logger.log(`Connected to ${config.dbHost}:${config.dbPort}/${config.dbDatabase}`, DBService.name);
    }

    query(text: string, params?: any[]): Promise<QueryResult> {
        try {
            return this.pool.query(text, params);
        } catch (err) {
            throw Error(err.stack);
        }
    }

    async client() {
      return await this.pool.connect();
  }
}