import { Module, HttpModule } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { DBModule } from "../db/db.module";
import { GameController } from "./game.controller";
import { UserModule } from "../user/user.module";
import { GameService } from "./game.service";
import { NotificationModule } from "../firebase/notification.module";

@Module({
  imports: [ConfigModule, HttpModule, DBModule, UserModule, NotificationModule],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
