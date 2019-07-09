import admin from "firebase-admin";
import { Injectable } from "@nestjs/common";

@Injectable()
export class NotificationService {

  public constructor() {
    const account = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

    admin.initializeApp({
      credential: admin.credential.cert(account),
      databaseURL: "https://story-game-60b91.firebaseio.com",
    });
  }

  public sendNotification(receiver: string, payload: admin.messaging.MessagingPayload) {
    admin.messaging().sendToDevice(receiver, payload);
  }
}