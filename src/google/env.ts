import "dotenv/config"

import { Env } from "fenviee";

export const env = Env.create(process.env)({
  partial: [] as const,
  required: ["GOOGLE_DRIVE_FOLDER_URL"] as const,
  unique: {} as const,
  default: {} as const
});
