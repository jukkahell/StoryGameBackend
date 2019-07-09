import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "../config/config.module";
import { ConfigService } from "../config/config.service";
import { LoggerService, LoggerTransport } from "nest-logger";
import { DBService } from "../db/db.service";

export class MockDBService {
  query(_query: string, _params?: any[]) {
    return new Promise(resolve => { resolve({ rowCount: 1 }); });
  }
}

describe("ChatService", () => {
  let app: TestingModule;

  const dbService = new MockDBService();
  let configService: ConfigService;

});
