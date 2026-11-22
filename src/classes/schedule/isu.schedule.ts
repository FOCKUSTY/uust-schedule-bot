// src/classes/schedule/isu.schedule.ts

import type {
  DaySchedule,
  DayScheduleInfo,
  GroupInformation,
  WeekSchedule,
  WeekScheduleInfo,
  WeeksSchedule,
} from "@/types";

import { IsuApi } from "../api/isu.api";
import { MemoryCache } from "../cache";
import { BaseSchedule } from "../base";
import { WEEKEND } from "@/constants";

const ISU_WEEKS_SCHEDULE_TTL_MS = 4 * 60 * 60 * 1000;
/** Максимальный номер недели, который пытаемся обойти в `getWeeksSchedule`. */
const ISU_MAX_WEEK = 52;

export class IsuSchedule extends BaseSchedule {
  private readonly _memory: MemoryCache = new MemoryCache("isu-schedule");
  public readonly api: IsuApi = new IsuApi();

  public constructor() {
    super();
  }

  public async getDaySchedule({
    dayNumber,
    ...weekInfo
  }: DayScheduleInfo): Promise<DaySchedule | null> {
    if (dayNumber === WEEKEND) {
      return null;
    }

    const week = await this.getWeekSchedule(weekInfo);
    return week?.[dayNumber] ?? null;
  }

  public async getWeekSchedule({
    group,
    weekNumber,
  }: WeekScheduleInfo): Promise<WeekSchedule | null> {
    return this.api.getWeekSchedule(group, weekNumber);
  }

  public async getWeeksSchedule(
    group: GroupInformation,
  ): Promise<WeeksSchedule> {
    const groupId = await this.api.getGroupId(group);
    if (groupId === undefined) {
      return {};
    }

    const cacheKey = `WEEKS_${groupId}`;

    return this._memory.use(
      cacheKey,
      async () => {
        const weeks: WeeksSchedule = {};

        for (let weekNumber = 0; weekNumber < ISU_MAX_WEEK; weekNumber++) {
          try {
            const week = await this.api.getWeekSchedule(group, weekNumber);
            if (week) {
              weeks[weekNumber] = week;
            }
          } catch (error) {
            console.warn(
              `[IsuSchedule] Failed to fetch week ${weekNumber} for ${group.group}:`,
              error,
            );
          }
        }

        return weeks;
      },
      { timeToLiveMs: ISU_WEEKS_SCHEDULE_TTL_MS },
    );
  }
}
