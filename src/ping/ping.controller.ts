import { Controller, Get } from "@nestjs/common";

@Controller()
export class PingController {
  constructor() {}

  @Get("/ping")
  async ping() {
    return true;
  }
}