import { env } from "../env";
import { ScheduleCache } from "../cache";

import { NotificationService } from "../notifications/notification.service";
import {
  GoogleDriveService,
  Schedule,
  ScheduleLoader,
  WeekCalculator,
} from "../schedule";
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
const cache = new ScheduleCache("global");
const loader = new ScheduleLoader(driveService, "global");
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

export const cacheAll = async () => {
  const weekCalculator = new WeekCalculator(env.START_DATE);

  const courses = driveService.getCourses();
  for (const course of await courses) {
    const specs = await driveService.getSpecializations(course.name);
    for (const spec of specs) {
      const groups = await driveService.getGroups(course.name, spec.name);
      group: for (const group of groups) {
        const schedule = new Schedule(
          {
            course: course.name,
            specialization: spec.name,
            group: group.name,
          },
          weekCalculator.getCurrentWeek(),
        );

        try {
          await schedule.getWeekSchedule();
          console.log(
            `Загружено расписание для ${course.name} ${spec.name} ${group.name}`,
          );
        } catch (error) {
          console.log(`Ошибка в ${course.name} ${spec.name} ${group.name}`);
          continue group;
        }
      }
    }
  }

  console.log("Кэширование завершено");
};

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
