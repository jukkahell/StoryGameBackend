export interface JwtPayload {
  sub: string;
  username: string;
}

export interface JwtToken {
  expires_in: string;
  access_token: string;
}