import type { NotificationService } from "../notifications/notification.service";
import {
  ONE_DAY_MS,
  type GroupInformation,
  type ScheduleWeek,
  type WeekCalculator,
} from "../schedule";

import { UserService } from "../database";
import { ScheduleCache } from "../cache";
import { ScheduleLoader } from "../schedule/schedule-loader";

export interface WatcherOptions {
  intervalMs: number;
}

export class ScheduleWatcher {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  public constructor(
    private readonly cache: ScheduleCache,
    private readonly notificationService: NotificationService,
    private readonly options: WatcherOptions,
    private readonly weekCalculator: WeekCalculator,
  ) {}

  /**
   * Запускает периодическую проверку.
   */
  public start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleNextCheck();
  }

  /**
   * Останавливает проверку.
   */
  public stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  private scheduleNextCheck(): void {
    if (!this.isRunning) {
      return;
    }

    console.log("Checking...");

    this.timer = setTimeout(async () => {
      await this.checkAllGroups();
      this.scheduleNextCheck();
    }, this.options.intervalMs);
  }

  /**
   * Проверяет все группы, присутствующие в кэше (секция default).
   */
  private async checkAllGroups(): Promise<void> {
    const cache = ScheduleCache.getGlobalGroupsCache();
    const groupKeys = await cache.keys();
    
    for (const key of groupKeys) {
      const value = await cache.get<{
        enabled: boolean;
        group: GroupInformation;
      }>(key);

      if (!value || !value.enabled) {
        continue;
      }

      await this.checkGroup(value.group);
    }
  }

  /**
   * Проверяет одну группу на наличие изменений.
   */
  private async checkGroup(group: GroupInformation): Promise<void> {
    const week = this.weekCalculator.getCurrentWeek();
    const scheduleLoader = new ScheduleLoader(group.group);

    const schedule = await scheduleLoader.loadWeekSchedule(group, week, true);
    const cachedSchedule = await this.cache.watcherCache.use(`${group.group}:${week}`, async () => {
      return schedule;
    }, {
      ttl: ONE_DAY_MS,
      maxCacheOperations: 1
    });

    const scheduleJson = JSON.stringify(schedule);
    const cachedScheduleJson = JSON.stringify(cachedSchedule);
    if (scheduleJson === cachedScheduleJson) {
      return;
    }

    console.log("Изменения расписания у " + group.group);

    await this.notificationService.notifyGroupChange(group);
  }
}
