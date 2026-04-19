import { env } from "../env";

import { PrismaClient } from "./generated/client";

export class Prisma extends PrismaClient {
  public constructor() {
    super({
      accelerateUrl: env.DATABASE_URL,
    });
  }
}
