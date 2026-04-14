import "dotenv/config"

import { Env } from "fenviee";

export const env = Env.create(process.env)({
  partial: [],
  required: ["GOOGLE_DRIVE_FOLDER_URL"],
  unique: {
    "START_DATE": (value?: string) => {
      if (!value) {
        throw new Error("START_DATE in .env is not defined");
      }

      return new Date(value);
    }
  },
  default: {}
});
