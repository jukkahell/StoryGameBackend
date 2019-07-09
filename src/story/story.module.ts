import { Module, HttpModule } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { DBModule } from "../db/db.module";
import { StoryController } from "./story.controller";
import { StoryService } from "./story.service";
import { GameModule } from "../game/game.module";
import { NotificationModule } from "../firebase/notification.module";

@Module({
  imports: [ConfigModule, HttpModule, DBModule, GameModule, NotificationModule],
  controllers: [StoryController],
  providers: [StoryService],
  exports: [StoryService],
})
export class StoryModule {}
