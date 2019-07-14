import { User } from "../user/user.interface";
import { Story } from "../story/story.interface";

export type GameStatus = "created" | "started" | "finished" | "deleted";
export type PrivacyMode = "private" | "public_read" | "public_read_write";

export interface Game {
  id: string;
  title: string;
  owner: string;
  created: string;
  users?: User[];
  status: GameStatus;
  settings: Settings;
  stories?: Story[];
  nextWriter?: User;
}

export interface GameDBO {
  id: string;
  title: string;
  owner: string;
  created: string;
  status: GameStatus;
  settings: Settings;
}

export interface Settings {
  locale: string;
  privacy: PrivacyMode;
  minWords: number;
  maxWords: number;
  roundsPerUser: number;
  wordsVisible: number;
  maxParticipants: number;
}

export interface GameUser extends User {
  position: number;
}