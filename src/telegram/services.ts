import { env } from "../env";
import { ScheduleCache } from "../cache";

import { NotificationService } from "../notifications/notification.service";
import { GoogleDriveService, ScheduleLoader } from "../schedule";
import { extractIdFromUrl } from "../schedule/google";

import { ScheduleWatcher } from "../watcher/schedule-watcher";
import { UserService } from "../database";

import { bot } from "./bot";

const userService = new UserService();

const rootFolderId = extractIdFromUrl(env.GOOGLE_DRIVE_FOLDER_URL);
if (!rootFolderId) {
  throw new Error("Invalid GOOGLE_DRIVE_FOLDER_URL");
}

const driveService = new GoogleDriveService(rootFolderId);
const cache = new ScheduleCache();
const loader = new ScheduleLoader(driveService);
const notificationService = new NotificationService(bot, userService);

const watcher = new ScheduleWatcher(
  driveService,
  cache,
  loader,
  notificationService,
  {
    intervalMs: env.WATCHER_INTERVAL_MINUTES * 60 * 1000,
  },
);

cache.loadAll().then(() => {
  watcher.start();
  console.log(
    `Schedule watcher started with interval ${env.WATCHER_INTERVAL_MINUTES} min`,
  );
});

process.on("SIGINT", () => {
  watcher.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  watcher.stop();
  process.exit(0);
});
