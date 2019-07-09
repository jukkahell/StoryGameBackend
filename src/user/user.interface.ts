export interface User {
  id: string;
  username: string;
  password?: string;
  locale?: string;
  fcm_token?: string;
}

export interface Fcm {
  token: string;
}