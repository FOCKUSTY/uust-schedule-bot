import { env } from "../env";

import { PrismaClient } from "./generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

const ADAPTER =
  env.PRISMA_CONNECTION_TYPE === "adapter"
    ? new PrismaPg({
        connectionString: env.DATABASE_URL,
        min: 2,
        idleTimeoutMillis: 10 * 60 * 1000,
        connectionTimeoutMillis: 20 * 1000,
        maxLifetimeSeconds: 15 * 60,
        max: 10,
      })
    : undefined;

const ACCELERATE_URL =
  env.PRISMA_CONNECTION_TYPE === "adapter" ? undefined : env.DATABASE_URL;

const OPTIONS = {
  adapter: ADAPTER,
  accelerateUrl: ACCELERATE_URL,
} as ConstructorParameters<typeof PrismaClient>[0];

export class Prisma extends PrismaClient {
  public constructor() {
    super(OPTIONS);
  }
}
