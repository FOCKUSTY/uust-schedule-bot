import type {
  DaySchedule,
  DayScheduleInfo,
  Pair,
  WeekScheduleInfo,
  WeeksSchedule,
} from "@/types";

import { AparkitApi } from "../api";
import { MemoryCache } from "../cache";
import {
  APARKIT_WEEKS_SCHEDULE_TTL_MS,
  LESSON_NUMBERS,
  UNKNOWN_LOCATION,
  UNKNOWN_TEACHER,
  WEEKEND,
} from "@/constants";

export class AparkitSchedule {
  private readonly _memory: MemoryCache = new MemoryCache("aparkit-schedule");
  public readonly api: AparkitApi = new AparkitApi();

  public constructor() {}

  public async getDaySchedule({
    dayNumber,
    ...weekInfo
  }: DayScheduleInfo): Promise<DaySchedule | null> {
    if (dayNumber === WEEKEND) {
      return null;
    }

    const week = await this.getWeekSchedule(weekInfo);
    const day = week?.[dayNumber];
    return day ?? null;
  }

  public async getWeekSchedule({ groupId, weekNumber }: WeekScheduleInfo) {
    const weeks = await this.getWeeksSchedule(groupId);
    if (Object.keys(weeks).length === 0) {
      return undefined;
    }

    return weeks[weekNumber];
  }

  public async getWeeksSchedule(groupId: number): Promise<WeeksSchedule> {
    const cacheKey = `WEEKS_${groupId}`;

    const cached = await this._memory.get<WeeksSchedule>(cacheKey);
    if (cached) {
      return cached;
    }

    const weeks = await this.getRawWeeksSchedule(groupId);

    if (Object.keys(weeks).length > 0) {
      await this._memory.set(cacheKey, weeks, APARKIT_WEEKS_SCHEDULE_TTL_MS);
    }

    return weeks;
  }

  private async getRawWeeksSchedule(groupId: number) {
    const lessons = await this.api.getGroupLessons(groupId);

    const weeks: WeeksSchedule = {};
    for (const lesson of lessons) {
      const teacherName = lesson.teacher?.fullname || UNKNOWN_TEACHER;
      const pair: Pair = {
        title: lesson.title,
        type: lesson.type,
        location: lesson.location ?? UNKNOWN_LOCATION,
        teacher: { name: teacherName },
      };

      for (const lessonWeek of lesson.weeks) {
        weeks[lessonWeek] = {
          ...(weeks?.[lessonWeek] ?? {}),
          [lesson.weekday]: {
            ...(weeks?.[lessonWeek]?.[lesson.weekday] ?? {}),
            [LESSON_NUMBERS[lesson.time_title!]]: pair,
          },
        };
      }
    }

    return weeks;
  }
}
