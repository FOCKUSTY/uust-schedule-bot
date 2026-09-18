import type {
  DaySchedule,
  DayScheduleInfo,
  GroupInformation,
  Pair,
  WeekScheduleInfo,
  WeeksSchedule,
} from "@/types";

import { AparkitApi } from "../api";
import { MemoryCache } from "../cache";
import {
  APARKIT_WEEKS_SCHEDULE_TTL_MS,
  LESSON_NUMBERS,
  MS_PER_HOUR,
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

  public async getWeekSchedule({ group, weekNumber }: WeekScheduleInfo) {
    const groupId = await this.getGroupId(group);
    const weeks = await this.getWeeksSchedule(groupId);
    if (Object.keys(weeks).length === 0) {
      return undefined;
    }

    return weeks[weekNumber];
  }

  public async getWeeksSchedule(
    group: number | GroupInformation,
  ): Promise<WeeksSchedule> {
    const groupId = await this.getGroupId(group);
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

  private async getRawWeeksSchedule(group: number | GroupInformation) {
    const groupId = await this.getGroupId(group);
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

  private async getGroupId(group: number | GroupInformation) {
    if (typeof group === "number") {
      return group;
    }

    const groupId = await this._memory.use(
      `GROUP_ID_${group.groupId}`,
      () => {
        return this.api.getGroupId(group, { skip: true });
      },
      {
        timeToLiveMs: MS_PER_HOUR,
        maxOperations: 50,
      },
    );

    if (!groupId) {
      throw new Error("Can not get group id");
    }

    return groupId;
  }
}
