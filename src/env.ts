import "dotenv/config";
import { Env } from "fenviee";

export const env = Env.create(process.env)({
  partial: [],
  required: ["GOOGLE_CREDENTIALS", "GOOGLE_DRIVE_FOLDER_URL", "DATABASE_URL", "TELEGRAM_BOT_TOKEN"],
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
  },
  default: {},
});
