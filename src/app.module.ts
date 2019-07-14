import { Module, HttpModule } from "@nestjs/common";
import { UserModule } from "./user/user.module";
import { GameModule } from "./game/game.module";
import { LoggerModule } from "./logging/logger.module";
import { AuthModule } from "./auth/auth.module";
import { StoryModule } from "./story/story.module";
import { NotificationModule } from "./firebase/notification.module";
import { PingModule } from "./ping/ping.module";

@Module({
  imports: [
    HttpModule,
    UserModule,
    GameModule,
    LoggerModule,
    AuthModule,
    StoryModule,
    NotificationModule,
    PingModule,
  ],
})
export class AppModule {}