import "dotenv/config";
import { Env, isInteger, isPort } from "fenviee";

export const env = Env.create(process.env)({
  partial: [],
  required: [
    "GOOGLE_DRIVE_FOLDER_URL",
    "DATABASE_URL",
    "TELEGRAM_BOT_TOKEN",
    "REDIS_URL",
    "PRISMA_CONNECTION_TYPE",
  ],
  unique: {
    START_DATE: (value?: string) => {
      if (!value) {
        throw new Error("START_DATE in .env is not defined");
      }
      return new Date(value);
    },
    WATCHER_INTERVAL_MINUTES: (value?: string) => {
      const parsed = value ? parseInt(value, 10) : 60;
      if (isNaN(parsed) || parsed <= 0) {
        return 60;
      }

      return parsed;
    },
    PORT: isPort,
    CACHE_TYPE: (value?: string) => {
      if (value === "redis") {
        return "redis";
      }

      return "file";
    },
    BOT_CREATOR_ID: isInteger,
  },
  default: {},
});
